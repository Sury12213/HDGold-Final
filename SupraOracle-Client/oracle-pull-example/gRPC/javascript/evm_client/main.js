const PullServiceClient = require("./pullServiceClient");
const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");

// Load .env from SupraOracle-Client root (local) or use env vars (GitHub Actions)
const envPath = path.resolve(__dirname, "../../../../.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

async function main() {
  const address = "testnet-dora-2.supra.com:443";
  const pairIndexes = [5500, 5014];
  const chainType = "evm";

  const client = new PullServiceClient(address);

  const request = {
    pair_indexes: pairIndexes,
    chain_type: chainType,
  };

  console.log("Requesting proof for price index:", request.pair_indexes);

  // Wrap callback-based getProof in a Promise so we can properly await it
  const response = await new Promise((resolve, reject) => {
    client.getProof(request, (err, res) => {
      if (err) {
        reject(new Error("gRPC error: " + (err.details || err.message)));
      } else {
        resolve(res);
      }
    });
  });

  console.log("Calling contract to verify the proofs..");
  await callContract(response.evm);
}

async function callContract(response) {
  const RPC_URL = "https://bsc-testnet-rpc.publicnode.com";
  const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

  const contractJson = require("../../resources/PriceFeeder.json");
  const contractAbi = contractJson.abi;
  const contractAddress = "0x570b30768B77709686afA1F8c7d3AE42cb35aa41";

  const contract = new web3.eth.Contract(contractAbi, contractAddress);

  const hex = web3.utils.bytesToHex(response.proof_bytes);

  // Decode oracle proof data
  const OracleProofABI = require("../../resources/oracleProof.json");
  let proof_data = web3.eth.abi.decodeParameters(OracleProofABI, hex);

  let pairId = [];
  let pairPrice = [];
  let pairDecimal = [];
  let pairTimestamp = [];

  for (let i = 0; i < proof_data[0].data.length; ++i) {
    for (
      let j = 0;
      j < proof_data[0].data[i].committee_data.committee_feed.length;
      j++
    ) {
      pairId.push(
        proof_data[0].data[i].committee_data.committee_feed[j].pair.toString(10)
      );
      pairPrice.push(
        proof_data[0].data[i].committee_data.committee_feed[j].price.toString(10)
      );
      pairDecimal.push(
        proof_data[0].data[i].committee_data.committee_feed[j].decimals.toString(10)
      );
      pairTimestamp.push(
        proof_data[0].data[i].committee_data.committee_feed[j].timestamp.toString(10)
      );
    }
  }

  console.log("Pair index :", pairId);
  console.log("Pair Price :", pairPrice);
  console.log("Pair Decimal:", pairDecimal);
  console.log("Pair Timestamp:", pairTimestamp);

  // Extract XAU/USD and USD/VND
  let xauUsd, usdVnd;
  for (let i = 0; i < pairId.length; i++) {
    if (pairId[i] === "5500") xauUsd = pairPrice[i];
    if (pairId[i] === "5014") usdVnd = pairPrice[i];
  }

  if (!xauUsd || !usdVnd) {
    throw new Error("Could not find XAUUSD or USDVND in oracle response");
  }

  const xauUsdBN = web3.utils.toBigInt(xauUsd);
  const usdVndBN = web3.utils.toBigInt(usdVnd);

  console.log("XAU/USD:", xauUsdBN.toString());
  console.log("USD/VND:", usdVndBN.toString());

  // Check wallet balance before sending tx
  const walletAddr = process.env.Wallet_Address;
  const privateKey = process.env.Private_Key;

  if (!walletAddr || !privateKey) {
    throw new Error("Missing env vars: Wallet_Address or Private_Key");
  }

  const balance = await web3.eth.getBalance(walletAddr);
  const balanceBNB = web3.utils.fromWei(balance, "ether");
  console.log(`Wallet ${walletAddr} balance: ${balanceBNB} BNB`);

  if (balance === 0n) {
    throw new Error("Wallet has 0 BNB — cannot pay gas fees!");
  }

  const txData = contract.methods.updatePrice(xauUsdBN, usdVndBN).encodeABI();

  const gasEstimate = await contract.methods
    .updatePrice(xauUsdBN, usdVndBN)
    .estimateGas({ from: walletAddr });

  const transactionObject = {
    from: walletAddr,
    to: contractAddress,
    data: txData,
    gas: gasEstimate,
    gasPrice: await web3.eth.getGasPrice(),
  };

  const signedTransaction = await web3.eth.accounts.signTransaction(
    transactionObject,
    privateKey
  );

  const receipt = await web3.eth.sendSignedTransaction(
    signedTransaction.rawTransaction
  );

  console.log("✅ Transaction successful:", receipt.transactionHash);

  // Log to file
  const now = new Date().toISOString();
  const logLine = `[${now}] XAU/USD: ${xauUsdBN.toString()} | USD/VND: ${usdVndBN.toString()} | Tx: ${receipt.transactionHash}\n`;
  fs.appendFileSync("oracle_updates.log", logLine, "utf8");
  console.log("Logged to oracle_updates.log");
}

// --- Entry point ---
const isOnce = process.argv.includes("--once");
const intervalMs = 5 * 60 * 1000;

main()
  .then(() => {
    if (isOnce) {
      console.log("Single run complete. Exiting.");
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error("❌ Oracle update FAILED:", err.message);
    if (isOnce) {
      process.exit(1); // Non-zero exit so GitHub Actions marks as ❌ failed
    }
  });

if (!isOnce) {
  setInterval(() => {
    console.log(
      `\n=== Starting update at ${new Date().toLocaleTimeString()} ===`
    );
    main().catch((err) => {
      console.error("❌ Oracle update FAILED:", err.message);
    });
  }, intervalMs);
}
