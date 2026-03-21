import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Landmark,
  TrendingUp,
  Coins,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  VAULT_ADDRESS,
  VAULT_ABI,
  STAKING_ADDRESS,
  STAKING_ABI,
  PRICE_FEEDER_ADDRESS,
  PRICE_FEEDER_ABI,
  ERC20_ABI,
  USDT_ADDRESS,
  KYC_ADDRESS,
  KYC_ABI,
} from '../constants';
import './DashboardPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

export const DashboardPage = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [chiPrice, setChiPrice] = useState(null);
  const [hdgBalance, setHdgBalance] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [usdtRewards, setUsdtRewards] = useState('0');
  const [isKyc, setIsKyc] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!window.ethereum) { setLoading(false); return; }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        // Gold price
        const priceFeed = new ethers.Contract(PRICE_FEEDER_ADDRESS, PRICE_FEEDER_ABI, provider);
        const priceVal = await priceFeed.getChiVnd();
        setChiPrice(Number(ethers.formatUnits(priceVal, 18)).toFixed(0));

        if (address) {
          // HDG balance
          const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
          const hdgBal = await vault.balanceOf(address);
          setHdgBalance(ethers.formatUnits(hdgBal, 18));

          // USDT balance
          const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
          const usdtBal = await usdt.balanceOf(address);
          setUsdtBalance(ethers.formatUnits(usdtBal, 18));

          // Staking
          const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
          const stake = await staking.stakes(address);
          setStakedAmount(ethers.formatUnits(stake.amount, 18));
          const pending = await staking.pendingRewards(address);
          setUsdtRewards(ethers.formatUnits(pending[0], 18));

          // KYC
          const kyc = new ethers.Contract(KYC_ADDRESS, KYC_ABI, provider);
          const hasKyc = await kyc.hasKYC(address);
          setIsKyc(hasKyc);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const quickActions = [
    { label: 'Mint HDG', icon: ArrowUpCircle, path: '/mint', color: '#00E676' },
    { label: 'Burn HDG', icon: ArrowDownCircle, path: '/burn', color: '#FF5252' },
    { label: 'Staking', icon: Landmark, path: '/staking', color: '#448AFF' },
    { label: 'KYC', icon: ShieldCheck, path: '/verification', color: '#FFD740' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <LoadingSpinner size={50} text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <motion.div initial="hidden" animate="visible" className="dashboard-header">
        <motion.div custom={0} variants={fadeUp}>
          <h1>Dashboard</h1>
          <p className="subtitle">Welcome to HDGold — Gold-backed DeFi on BNB Chain</p>
        </motion.div>
      </motion.div>

      {/* Gold Price Hero */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className="gold-hero glass-card">
          <div className="gold-hero-content">
            <div className="gold-hero-label">
              <TrendingUp size={18} />
              <span>Giá vàng realtime</span>
            </div>
            <div className="gold-hero-price">
              {chiPrice ? `${Number(chiPrice).toLocaleString()} ₫` : '-- ₫'}
            </div>
            <span className="gold-hero-unit">VND / chỉ vàng</span>
          </div>
          <div className="gold-hero-glow" />
        </div>
      </motion.div>

      {/* Portfolio Stats */}
      {isConnected && (
        <motion.div initial="hidden" animate="visible" className="stats-grid">
          {[
            { label: 'HDG Balance', value: `${Number(hdgBalance).toFixed(4)} HDG`, icon: Coins, color: 'var(--gold-500)' },
            { label: 'USDT Balance', value: `${Number(usdtBalance).toFixed(4)} USDT`, icon: Wallet, color: '#26A17B' },
            { label: 'Staked HDG', value: `${Number(stakedAmount).toFixed(4)} HDG`, icon: Landmark, color: '#448AFF' },
            { label: 'Pending Rewards', value: `${Number(usdtRewards).toFixed(6)} USDT`, icon: TrendingUp, color: 'var(--color-success)' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} custom={i + 2} variants={fadeUp}>
                <GlassCard className="stat-card">
                  <div className="stat-icon" style={{ color: stat.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-value">{stat.value}</span>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* KYC Status */}
      {isConnected && (
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard className={`kyc-status ${isKyc ? 'verified' : 'unverified'}`}>
            <ShieldCheck size={20} />
            <span>{isKyc ? 'KYC Verified ✓' : 'KYC Not Verified — Complete verification to access all features'}</span>
            {!isKyc && (
              <button className="btn-secondary" style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => navigate('/verification')}>
                Verify Now
              </button>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div initial="hidden" animate="visible" className="actions-section">
        <motion.h2 custom={7} variants={fadeUp}>Quick Actions</motion.h2>
        <div className="actions-grid">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.label} custom={i + 8} variants={fadeUp}>
                <GlassCard
                  className="action-card"
                  onClick={() => navigate(action.path)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon" style={{ color: action.color }}>
                    <Icon size={28} />
                  </div>
                  <span className="action-label">{action.label}</span>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Not Connected */}
      {!isConnected && (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard className="connect-prompt">
            <Wallet size={32} className="text-gold" />
            <h3>Connect Your Wallet</h3>
            <p className="text-muted">Connect your wallet to view portfolio, mint, stake and more.</p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};
