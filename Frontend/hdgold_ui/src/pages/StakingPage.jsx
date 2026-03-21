import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Landmark, TrendingUp, Coins, Gift } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  STAKING_ABI, STAKING_ADDRESS,
  VAULT_ABI, VAULT_ADDRESS,
} from '../constants';
import './StakingPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export const StakingPage = () => {
  const { address } = useAccount();

  const [totalStaked, setTotalStaked] = useState('0');
  const [myStaked, setMyStaked] = useState('0');
  const [availableHDG, setAvailableHDG] = useState('0');
  const [apy, setApy] = useState('0');
  const [usdtRewards, setUsdtRewards] = useState('0');
  const [soviRewards, setSoviRewards] = useState('0');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [loading, setLoading] = useState(null); // 'stake' | 'unstake' | 'claim'
  const [fetching, setFetching] = useState(true);

  const fetchStakingInfo = useCallback(async () => {
    if (!address || !window.ethereum) { setFetching(false); return; }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

      const [totalWei, userStake, balance, pending, rewardRate] = await Promise.all([
        staking.totalStaked(),
        staking.stakes(address),
        vault.balanceOf(address),
        staking.pendingRewards(address),
        staking.rewardRateUSDT(),
      ]);

      setTotalStaked(ethers.formatUnits(totalWei, 18));
      setMyStaked(ethers.formatUnits(userStake.amount, 18));
      setAvailableHDG(ethers.formatUnits(balance, 18));
      setUsdtRewards(ethers.formatUnits(pending[0], 18));
      setSoviRewards(ethers.formatUnits(pending[1], 18));

      const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
      const apyCalc = (Number(rewardRate) * SECONDS_PER_YEAR / 1e18) * 100;
      setApy(apyCalc.toFixed(2));
    } catch (err) {
      console.error('staking fetch error:', err);
    } finally {
      setFetching(false);
    }
  }, [address]);

  useEffect(() => { fetchStakingInfo(); }, [fetchStakingInfo]);

  const handleStake = async () => {
    if (!stakeAmount || !address) return;
    try {
      setLoading('stake');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      const amountWei = ethers.parseUnits(stakeAmount, 18);

      toast.loading('Approving HDG...', { id: 'stake' });
      const approveTx = await vault.approve(STAKING_ADDRESS, amountWei);
      await approveTx.wait();

      toast.loading('Staking HDG...', { id: 'stake' });
      const stakeTx = await staking.stake(amountWei);
      await stakeTx.wait();

      toast.success('Staked successfully! 🎉', { id: 'stake' });
      setStakeAmount('');
      fetchStakingInfo();
    } catch (err) {
      console.error(err);
      toast.error('Stake failed: ' + (err.reason || err.message), { id: 'stake' });
    } finally {
      setLoading(null);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || !address || Number(unstakeAmount) <= 0) return;
    try {
      setLoading('unstake');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      const amountWei = ethers.parseUnits(unstakeAmount, 18);

      toast.loading('Unstaking HDG...', { id: 'unstake' });
      const tx = await staking.unstake(amountWei);
      await tx.wait();

      toast.success('Unstaked successfully! 🎉', { id: 'unstake' });
      setUnstakeAmount('');
      fetchStakingInfo();
    } catch (err) {
      console.error(err);
      toast.error('Unstake failed: ' + (err.reason || err.message), { id: 'unstake' });
    } finally {
      setLoading(null);
    }
  };

  const handleClaim = async () => {
    try {
      setLoading('claim');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

      toast.loading('Claiming rewards...', { id: 'claim' });
      const tx = await staking.claimReward();
      await tx.wait();

      toast.success('Rewards claimed! 🎉', { id: 'claim' });
      fetchStakingInfo();
    } catch (err) {
      console.error(err);
      toast.error('Claim failed: ' + (err.reason || err.message), { id: 'claim' });
    } finally {
      setLoading(null);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10vh' }}>
        <LoadingSpinner text="Loading staking data..." />
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" className="staking-page">
      <motion.div custom={0} variants={fadeUp} className="page-header">
        <h1>HDG Staking</h1>
        <p className="text-muted">Stake HDG tokens and earn USDT rewards + SOVI points</p>
      </motion.div>

      {/* Stats */}
      <div className="staking-stats">
        {[
          { label: 'Total Staked', value: `${Number(totalStaked).toFixed(2)} HDG`, icon: Landmark, color: 'var(--gold-500)' },
          { label: 'Current APY', value: `${apy}%`, icon: TrendingUp, color: 'var(--color-success)' },
          { label: 'My Staked', value: `${Number(myStaked).toFixed(4)} HDG`, icon: Coins, color: '#448AFF' },
          { label: 'USDT Rewards', value: `${Number(usdtRewards).toFixed(6)}`, icon: Gift, color: '#26A17B' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} custom={i + 1} variants={fadeUp}>
              <GlassCard className="staking-stat-card">
                <div className="stat-icon" style={{ color: s.color }}>
                  <Icon size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value">{s.value}</span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <div className="staking-grid">
        {/* Stake Box */}
        <motion.div custom={5} variants={fadeUp}>
          <GlassCard className="staking-action-card">
            <h3><Landmark size={18} /> Stake HDG</h3>
            <div className="staking-input-row">
              <input
                type="number"
                className="input-field"
                placeholder="0.00 HDG"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                disabled={!address}
              />
              <button className="max-tag" onClick={() => setStakeAmount(availableHDG)}>MAX</button>
            </div>
            <span className="input-helper">Available: {Number(availableHDG).toFixed(4)} HDG</span>
            <button className="btn-primary" onClick={handleStake} disabled={!address || loading === 'stake'}>
              <span>{loading === 'stake' ? 'Staking...' : 'Stake HDG'}</span>
            </button>
          </GlassCard>
        </motion.div>

        {/* Position Box */}
        <motion.div custom={6} variants={fadeUp}>
          <GlassCard className="staking-action-card">
            <h3><Coins size={18} /> My Position</h3>
            <div className="position-info">
              <div className="pos-row"><span>Staked</span><b>{Number(myStaked).toFixed(4)} HDG</b></div>
              <div className="pos-row"><span>USDT Rewards</span><b>{Number(usdtRewards).toFixed(6)}</b></div>
              <div className="pos-row"><span>SOVI Points</span><b>{Number(soviRewards).toFixed(6)}</b></div>
            </div>

            <div className="unstake-section">
              <div className="staking-input-row">
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00 HDG"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  disabled={!address}
                />
                <button className="max-tag" onClick={() => setUnstakeAmount(myStaked)}>MAX</button>
              </div>
              <div className="pos-buttons">
                <button className="btn-secondary" onClick={handleUnstake} disabled={!address || loading === 'unstake'}>
                  {loading === 'unstake' ? 'Unstaking...' : 'Unstake'}
                </button>
                <button className="btn-primary" onClick={handleClaim} disabled={!address || loading === 'claim'}>
                  <span>{loading === 'claim' ? 'Claiming...' : 'Claim Rewards'}</span>
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
};
