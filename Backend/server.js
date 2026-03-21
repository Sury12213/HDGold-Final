// ===== HDGold KYC Server =====
// Telegram Bot + Cloudinary + On-chain SBT Minting

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require('ethers');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const PORT = process.env.PORT || 4000;
const RPC_URL = 'https://bsc-testnet-rpc.publicnode.com';
const KYC_SBT_ADDRESS = '0x33FEcC1536d8714499340b99545D54784096aE2C';

// ===== ABI =====
let raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'SoulboundKYC.json'), 'utf8'));
const KYC_SBT_ABI = raw.abi ? raw.abi : raw;

// ===== CLOUDINARY =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===== ETHERS =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
const ownerKey = (process.env.OWNER_PRIVATE_KEY || '').trim();
if (!ownerKey || !ownerKey.startsWith('0x') || ownerKey.length !== 66) {
  throw new Error('❌ Private key invalid. Check .env (must be 0x + 64 hex).');
}
const ownerWallet = new ethers.Wallet(ownerKey, provider);
const kycContract = new ethers.Contract(KYC_SBT_ADDRESS, KYC_SBT_ABI, ownerWallet);

// ===== TELEGRAM BOT =====
const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const adminChatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
let bot = null;

if (botToken && adminChatId) {
  bot = new TelegramBot(botToken, {
    polling: {
      interval: 2000,
      autoStart: true,
      params: { timeout: 10 },
    },
  });

  // Suppress transient polling errors (network hiccups, etc.)
  bot.on('polling_error', (err) => {
    // Only log if it's NOT a typical transient error
    if (!err.message?.includes('ETELEGRAM')) {
      console.error('Telegram polling error:', err.message);
    }
  });

  // Verify bot is working
  bot.getMe().then((me) => {
    console.log(`✅ Telegram Bot connected: @${me.username}`);
  }).catch((err) => {
    console.error('❌ Telegram Bot token INVALID:', err.message);
    console.error('   Please check TELEGRAM_BOT_TOKEN in .env');
  });

  // Handle approve/reject button clicks
  bot.on('callback_query', async (query) => {
    const data = query.data; // "approve_0xABC..." or "reject_0xABC..."
    const [action, wallet] = data.split('_0x');
    const userAddress = '0x' + wallet;

    try {
      if (action === 'approve') {
        bot.answerCallbackQuery(query.id, { text: '⏳ Minting SBT...' });

        // Check if already minted
        const hasKyc = await kycContract.hasKYC(userAddress);
        if (hasKyc) {
          await bot.editMessageCaption(`✅ *ALREADY VERIFIED*\n\nWallet: \`${userAddress}\`\n\nUser already has KYC SBT.`, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
          });
          removeRequest(userAddress);
          return;
        }

        // Mint SBT
        const uri = `ipfs://kyc-${userAddress.toLowerCase()}`;
        const tx = await kycContract.safeMint(userAddress, uri);
        await tx.wait();

        await bot.editMessageCaption(`✅ *APPROVED & MINTED*\n\nWallet: \`${userAddress}\`\nTx: \`${tx.hash}\``, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
        });

        removeRequest(userAddress);
        console.log(`✅ KYC approved & minted for ${userAddress}`);

      } else if (action === 'reject') {
        bot.answerCallbackQuery(query.id, { text: '❌ Rejected' });

        // Update request status to rejected
        updateRequestStatus(userAddress, 'rejected');

        await bot.editMessageCaption(`❌ *REJECTED*\n\nWallet: \`${userAddress}\`\nUser can re-submit.`, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
        });

        console.log(`❌ KYC rejected for ${userAddress}`);
      }
    } catch (err) {
      console.error('Bot callback error:', err);
      bot.answerCallbackQuery(query.id, { text: '❌ Error: ' + err.message });
    }
  });
} else {
  console.warn('⚠️ Telegram Bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env');
}

// ===== JSON FILE STORAGE =====
const JSON_PATH = path.join(__dirname, 'kyc_requests.json');

function loadRequests() {
  try {
    const data = fs.readFileSync(JSON_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveRequests(requests) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(requests, null, 2), 'utf8');
}

function addRequest(req) {
  const requests = loadRequests();
  // Remove old request from same wallet (allow re-submit)
  const filtered = requests.filter((r) => r.wallet.toLowerCase() !== req.wallet.toLowerCase());
  filtered.push(req);
  saveRequests(filtered);
}

function removeRequest(wallet) {
  const requests = loadRequests();
  const filtered = requests.filter((r) => r.wallet.toLowerCase() !== wallet.toLowerCase());
  saveRequests(filtered);
}

function updateRequestStatus(wallet, status) {
  const requests = loadRequests();
  const req = requests.find((r) => r.wallet.toLowerCase() === wallet.toLowerCase());
  if (req) {
    req.status = status;
    saveRequests(requests);
  }
}

function getRequest(wallet) {
  const requests = loadRequests();
  return requests.find((r) => r.wallet.toLowerCase() === wallet.toLowerCase()) || null;
}

// ===== MULTER (temp upload to memory) =====
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  },
});

// Upload buffer to Cloudinary
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `hdgold-kyc/${folder}`, resource_type: 'image' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ===== EXPRESS =====
const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting
const kycLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { success: false, error: 'Too many KYC submissions. Try again later.' },
});

// ===== API FORMAT =====
const ok = (data) => ({ success: true, ...data });
const fail = (msg, status = 400) => ({ success: false, error: msg });

// ===== ROUTES =====

// POST /kyc/submit — upload images + send to Telegram for review
app.post('/kyc/submit', kycLimiter, upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]), async (req, res) => {
  try {
    const { wallet } = req.body;

    if (!wallet || !ethers.isAddress(wallet)) {
      return res.status(400).json(fail('Invalid wallet address'));
    }

    // Check if already verified
    const hasKyc = await kycContract.hasKYC(wallet);
    if (hasKyc) {
      return res.status(400).json(fail('Already KYC verified'));
    }

    // Check if pending
    const existing = getRequest(wallet);
    if (existing && existing.status === 'pending') {
      return res.status(400).json(fail('KYC already pending review'));
    }

    // Check files
    if (!req.files?.idCard?.[0] || !req.files?.selfie?.[0]) {
      return res.status(400).json(fail('Both idCard and selfie images required'));
    }

    console.log(`📤 Uploading KYC images for ${wallet}...`);

    // Upload to Cloudinary
    const [idResult, selfieResult] = await Promise.all([
      uploadToCloudinary(req.files.idCard[0].buffer, 'id-cards'),
      uploadToCloudinary(req.files.selfie[0].buffer, 'selfies'),
    ]);

    const idCardUrl = idResult.secure_url;
    const selfieUrl = selfieResult.secure_url;

    // Save to JSON
    const request = {
      wallet,
      idCardUrl,
      selfieUrl,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    addRequest(request);

    // Send to Telegram
    if (bot && adminChatId) {
      // Send ID card photo
      await bot.sendPhoto(adminChatId, idCardUrl, {
        caption: `🆔 *KYC Request*\n\nWallet: \`${wallet}\`\nImage: ID Card\nTime: ${request.submittedAt}`,
        parse_mode: 'Markdown',
      });

      // Send selfie photo with approve/reject buttons
      await bot.sendPhoto(adminChatId, selfieUrl, {
        caption: `🤳 *Selfie*\n\nWallet: \`${wallet}\`\n\n⬇️ Approve or Reject below:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Approve', callback_data: `approve_${wallet}` },
            { text: '❌ Reject', callback_data: `reject_${wallet}` },
          ]],
        },
      });

      console.log(`📨 Sent KYC request to Telegram for ${wallet}`);
    }

    res.json(ok({ message: 'KYC submitted! Awaiting admin review.', idCardUrl, selfieUrl }));
  } catch (err) {
    console.error('❌ /kyc/submit error:', err);
    res.status(500).json(fail('Server error: ' + err.message));
  }
});

// GET /kyc/status/:address — check pending/rejected/verified
app.get('/kyc/status/:address', async (req, res) => {
  try {
    const addr = req.params.address;
    if (!ethers.isAddress(addr)) {
      return res.status(400).json(fail('Invalid address'));
    }

    // Check on-chain first
    const hasKyc = await kycContract.hasKYC(addr);
    if (hasKyc) {
      return res.json(ok({ status: 'verified' }));
    }

    // Check JSON
    const request = getRequest(addr);
    if (request) {
      return res.json(ok({ status: request.status, submittedAt: request.submittedAt }));
    }

    res.json(ok({ status: 'none' }));
  } catch (err) {
    console.error('❌ /kyc/status error:', err);
    res.status(500).json(fail('Server error: ' + err.message));
  }
});

// GET /kyc/check/:address — simple boolean check (backward compatible)
app.get('/kyc/check/:address', async (req, res) => {
  try {
    const addr = req.params.address;
    if (!ethers.isAddress(addr)) {
      return res.status(400).json(fail('Invalid address'));
    }

    const hasKyc = await kycContract.hasKYC(addr);
    res.json(ok({ address: addr, kyc: hasKyc }));
  } catch (err) {
    console.error('❌ /kyc/check error:', err);
    res.status(500).json(fail('Server error: ' + err.message));
  }
});

// Legacy: POST /kyc/mint (kept for backward compatibility but now requires admin)
app.post('/kyc/mint', async (req, res) => {
  res.status(403).json(fail('Direct minting disabled. Use /kyc/submit to upload images for admin review.'));
});

// Health check
app.get('/', (req, res) => {
  res.json(ok({ service: 'HDGold KYC Server', version: '2.0.0' }));
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`\n🚀 HDGold KYC Server v2.0`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Owner: ${ownerWallet.address}`);
  console.log(`   Telegram: ${bot ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '❌ Not configured'}\n`);
});
