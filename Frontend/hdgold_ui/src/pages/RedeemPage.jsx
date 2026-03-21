import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { Gift, X } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { VAULT_ABI, VAULT_ADDRESS, KYC_ABI, KYC_ADDRESS } from '../constants';
import './RedeemPage.css';

export const RedeemPage = () => {
  const { address } = useAccount();
  const [hdgBalance, setHdgBalance] = useState('0');
  const [amount, setAmount] = useState('');
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [kycTokenId, setKycTokenId] = useState(null);

  const fetchData = useCallback(async () => {
    if (!address || !window.ethereum) { setFetching(false); return; }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      const bal = await vault.balanceOf(address);
      setHdgBalance(ethers.formatUnits(bal, 18));

      try {
        const kyc = new ethers.Contract(KYC_ADDRESS, KYC_ABI, provider);
        const tokenId = await kyc.tokenOfOwnerByIndex(address, 0);
        setKycTokenId(tokenId.toString());
      } catch { /* no KYC NFT */ }
    } catch (err) {
      console.error('fetch data error:', err);
    } finally {
      setFetching(false);
    }
  }, [address]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInput = (val) => {
    if (/^\d*$/.test(val)) setAmount(val);
  };

  const handleRedeem = async () => {
    if (!address || !amount || amount === '0') return;
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const amountWei = ethers.parseUnits(amount.toString(), 18);

      toast.loading('Processing redemption...', { id: 'redeem' });
      const tx = await vault.redeemPhysical(amountWei);
      await tx.wait();

      const payload = {
        txHash: tx.hash,
        user: address,
        amount: `${amount} HDG`,
        kycTokenId: kycTokenId || 'N/A',
        timestamp: Date.now(),
      };
      setQrData(JSON.stringify(payload));
      toast.success('Redemption successful! 🎉', { id: 'redeem' });
      fetchData();
    } catch (err) {
      console.error('redeem error:', err);
      toast.error('Redemption failed: ' + (err.reason || err.message), { id: 'redeem' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10vh' }}>
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  return (
    <motion.div
      className="redeem-container"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <h1>Redeem HDG</h1>
        <p className="text-muted">Exchange HDG tokens for physical gold</p>
      </div>

      <GlassCard className="redeem-card">
        <div className="redeem-input-section">
          <div className="redeem-row">
            <span className="swap-label">HDG Amount</span>
            <span className="swap-balance">
              Available: {Number(hdgBalance).toFixed(4)} HDG
            </span>
          </div>
          <div className="token-input-box">
            <div className="token-badge hdg-badge">
              <span className="token-icon">⬡</span>
              <span>HDG</span>
            </div>
            <input
              type="text"
              className="input-field token-amount-input"
              placeholder="Enter amount (1, 2, 3...)"
              value={amount}
              onChange={(e) => handleInput(e.target.value)}
              disabled={!address}
            />
          </div>
          <div className="quick-btns">
            {[1, 2, 5].map((n) => (
              <button key={n} className="quick-btn" onClick={() => setAmount(String(n))}>{n}</button>
            ))}
            <button className="quick-btn gold" onClick={() => setAmount(String(Math.floor(Number(hdgBalance))))}>MAX</button>
          </div>
        </div>

        <div className="redeem-info glass-card">
          <Gift size={18} className="text-gold" />
          <p>Each HDG token = 1 tael of physical gold. Redeemed tokens will be burned and physical gold delivered.</p>
        </div>

        <button className="btn-primary swap-btn" onClick={handleRedeem} disabled={loading || !address || !amount}>
          <span>{loading ? 'Processing...' : 'Redeem HDG'}</span>
        </button>
      </GlassCard>

      {/* QR Modal */}
      {qrData && (
        <div className="qr-overlay" onClick={() => setQrData(null)}>
          <motion.div
            className="qr-modal glass-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <button className="qr-close" onClick={() => setQrData(null)}><X size={20} /></button>
            <h3>🎉 Redemption Successful</h3>
            <p className="text-muted">Scan this QR at HDBank to claim your gold</p>
            <div className="qr-canvas">
              <QRCodeCanvas value={qrData} size={200} bgColor="#12121a" fgColor="#F5A623" />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
