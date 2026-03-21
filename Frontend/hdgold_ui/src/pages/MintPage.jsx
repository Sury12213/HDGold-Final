import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowDown } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

import { VAULT_ADDRESS, VAULT_ABI, USDT_ADDRESS, ERC20_ABI, TOKENS } from '../constants';
import './MintPage.css';

export const MintPage = () => {
  const { address } = useAccount();


  const [usdtBalance, setUsdtBalance] = useState('0');
  const [hdgBalance, setHdgBalance] = useState('0');
  const [usdtValue, setUsdtValue] = useState('');
  const [hdgValue, setHdgValue] = useState('0');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const getContracts = () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner().then((signer) => ({
      vault: new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer),
      usdt: new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer),
      provider,
    }));
  };

  const fetchBalances = async () => {
    if (!address || !window.ethereum) { setFetching(false); return; }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

      const [uBal, hBal] = await Promise.all([
        usdt.balanceOf(address),
        vault.balanceOf(address),
      ]);
      setUsdtBalance(ethers.formatUnits(uBal, 18));
      setHdgBalance(ethers.formatUnits(hBal, 18));
    } catch (err) {
      console.error('Fetch balances error:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchBalances(); }, [address]);

  const handleUsdtInput = async (val) => {
    setUsdtValue(val);
    if (!val || val === '0' || val === '0.') { setHdgValue('0'); return; }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      const usdtInput = ethers.parseUnits(val.toString(), 18);
      const result = await vault.quoteChiFromUSDT(usdtInput);
      setHdgValue(ethers.formatUnits(result[0], 18));
    } catch (err) {
      console.error('quoteChiFromUSDT error:', err);
      setHdgValue('0');
    }
  };

  const mint = async () => {
    if (!address || !usdtValue) return;
    try {
      setLoading(true);
      const { vault, usdt } = await getContracts();
      const amount = ethers.parseUnits(usdtValue.toString(), 18);

      toast.loading('Approving USDT...', { id: 'mint' });
      const approveTx = await usdt.approve(VAULT_ADDRESS, amount);
      await approveTx.wait();

      toast.loading('Minting HDG...', { id: 'mint' });
      const mintTx = await vault.mintByUSDT(amount);
      await mintTx.wait();

      toast.success('Mint successful! 🎉', { id: 'mint' });

      fetchBalances();
      setUsdtValue('');
      setHdgValue('0');
    } catch (err) {
      console.error('Mint error:', err);
      toast.error('Mint failed: ' + (err.reason || err.message), { id: 'mint' });
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
      className="page-container"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <h1>Mint HDG</h1>
        <p className="text-muted">Swap USDT to HDG gold-backed tokens</p>
      </div>

      <GlassCard className="swap-card">
        {/* From */}
        <div className="swap-section">
          <div className="swap-row">
            <span className="swap-label">From</span>
            <span className="swap-balance">
              Balance: {address ? Number(usdtBalance).toFixed(4) : '0.0000'} USDT
            </span>
          </div>
          <div className="token-input-box">
            <div className="token-badge usdt-badge">
              <span className="token-icon">₮</span>
              <span>USDT</span>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                className="input-field token-amount-input"
                placeholder="0.00"
                value={usdtValue}
                onChange={(e) => handleUsdtInput(e.target.value)}
                disabled={!address}
              />
              <button
                className="max-tag"
                onClick={() => handleUsdtInput(usdtBalance)}
                disabled={!address}
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="swap-divider">
          <div className="swap-arrow-circle">
            <ArrowDown size={18} />
          </div>
        </div>

        {/* To */}
        <div className="swap-section">
          <div className="swap-row">
            <span className="swap-label">To</span>
            <span className="swap-balance">
              Balance: {address ? Number(hdgBalance).toFixed(4) : '0.0000'} HDG
            </span>
          </div>
          <div className="token-input-box">
            <div className="token-badge hdg-badge">
              <span className="token-icon">⬡</span>
              <span>HDG</span>
            </div>
            <div className="output-value">{Number(hdgValue).toFixed(6) || '0.00'}</div>
          </div>
        </div>

        {/* Action */}
        <button className="btn-primary swap-btn" onClick={mint} disabled={!address || loading || !usdtValue}>
          <span>{loading ? 'Processing...' : 'Mint HDG'}</span>
        </button>
      </GlassCard>
    </motion.div>
  );
};
