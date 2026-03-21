import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Ticket } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  STAKING_ADDRESS, STAKING_ABI,
  SOVI_ADDRESS, SOVI_ABI,
} from '../constants';
import './VoucherPage.css';

const vouchers = [
  { id: 1, brand: 'VIETJET', title: 'Vietjet Flight Voucher', desc: '500k VND discount', price: '50', color: '#e74c3c' },
  { id: 2, brand: 'HDBANK', title: 'HDBank Cashback', desc: '1% cashback', price: '20', color: '#3498db' },
  { id: 3, brand: 'FURAMA', title: 'Furama Resort Voucher', desc: '2M VND discount', price: '80', color: '#27ae60' },
  { id: 4, brand: 'BAMBOO', title: 'Bamboo Airways Ticket', desc: '10% off domestic flights', price: '70', color: '#e91e63' },
  { id: 5, brand: 'SOVICO', title: 'Sovico Lifestyle', desc: 'Shopping voucher 200k VND', price: '30', color: '#9b59b6' },
  { id: 6, brand: 'HDBANK', title: 'HDBank Loan Fee Discount', desc: '0.5% loan fee off', price: '60', color: '#f39c12' },
  { id: 7, brand: 'BAMBOO', title: 'Bamboo Airways Lounge', desc: 'Free lounge access', price: '40', color: '#e74c3c' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4 },
  }),
};

export const VoucherPage = () => {
  const { address } = useAccount();
  const [soviBalance, setSoviBalance] = useState('0');
  const [qrData, setQrData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    const loadBalance = async () => {
      if (!address || !window.ethereum) { setFetching(false); return; }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const sovi = new ethers.Contract(SOVI_ADDRESS, SOVI_ABI, provider);
        const balance = await sovi.balanceOf(address);
        setSoviBalance(ethers.formatUnits(balance, 18));
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    loadBalance();
  }, [address]);

  const handleRedeem = async (voucher) => {
    if (!address) return;
    try {
      setLoadingId(voucher.id);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      const costWei = ethers.parseUnits(voucher.price, 18);

      toast.loading('Redeeming voucher...', { id: 'voucher' });
      const tx = await staking.redeemVoucher(voucher.id, costWei);
      await tx.wait();

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      const qrCodeValue = `${voucher.title}-${code}`;
      setQrData(qrCodeValue);

      toast.success('Voucher redeemed! 🎉', { id: 'voucher' });

      // Reload balance
      const sovi = new ethers.Contract(SOVI_ADDRESS, SOVI_ABI, provider);
      const balance = await sovi.balanceOf(address);
      setSoviBalance(ethers.formatUnits(balance, 18));
    } catch (err) {
      console.error(err);
      toast.error('Redeem failed: ' + (err.reason || err.message), { id: 'voucher' });
    } finally {
      setLoadingId(null);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10vh' }}>
        <LoadingSpinner text="Loading vouchers..." />
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" className="voucher-page">
      <motion.div custom={0} variants={fadeUp} className="voucher-header-section">
        <div>
          <h1>SOVI Voucher Store</h1>
          <p className="text-muted">Exchange SOVI points for premium vouchers</p>
        </div>
        <GlassCard className="sovi-balance-card">
          <Ticket size={18} className="text-gold" />
          <div>
            <span className="balance-label">SOVI Balance</span>
            <span className="balance-value">{Number(soviBalance).toFixed(4)}</span>
          </div>
        </GlassCard>
      </motion.div>

      <div className="voucher-grid">
        {vouchers.map((v, i) => (
          <motion.div key={v.id} custom={i + 1} variants={fadeUp}>
            <GlassCard className="voucher-card">
              <div className="voucher-brand" style={{ background: v.color }}>{v.brand}</div>
              <h3 className="voucher-title">{v.title}</h3>
              <p className="voucher-desc">{v.desc}</p>
              <div className="voucher-price">{v.price} SOVI</div>
              <button
                className="btn-primary voucher-btn"
                onClick={() => handleRedeem(v)}
                disabled={!address || loadingId === v.id}
              >
                <span>{loadingId === v.id ? 'Processing...' : 'Exchange'}</span>
              </button>
            </GlassCard>
          </motion.div>
        ))}
      </div>

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
            <h3>🎉 Voucher Redeemed!</h3>
            <QRCodeCanvas value={qrData} size={200} bgColor="#12121a" fgColor="#F5A623" />
            <p className="qr-code-text">{qrData}</p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
