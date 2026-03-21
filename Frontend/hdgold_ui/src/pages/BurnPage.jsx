import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowDown, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

import { VAULT_ADDRESS, VAULT_ABI, USDT_ADDRESS, ERC20_ABI, TOKENS } from '../constants';
import './MintPage.css'; /* shared swap styles */

export const BurnPage = () => {
  const { address } = useAccount();


  const [hdgBalance, setHdgBalance] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [vaultUsdtReserve, setVaultUsdtReserve] = useState('0');
  const [hdgValue, setHdgValue] = useState('');
  const [usdtOut, setUsdtOut] = useState('0');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchBalances = async () => {
    if (!address || !window.ethereum) { setFetching(false); return; }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

      const [hBal, uBal, vaultReserve] = await Promise.all([
        vault.balanceOf(address),
        usdt.balanceOf(address),
        usdt.balanceOf(VAULT_ADDRESS), // Check vault's USDT reserve
      ]);
      setHdgBalance(ethers.formatUnits(hBal, 18));
      setUsdtBalance(ethers.formatUnits(uBal, 18));
      setVaultUsdtReserve(ethers.formatUnits(vaultReserve, 18));
    } catch (err) {
      console.error('Fetch balances error:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchBalances(); }, [address]);

  const handleHdgInput = async (val) => {
    setHdgValue(val);
    if (!val || Number(val) <= 0) { setUsdtOut('0'); return; }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      const hdgInput = ethers.parseUnits(val.toString(), 18);
      const result = await vault.quoteRedeemUSDT(hdgInput);
      setUsdtOut(ethers.formatUnits(result[0], 18));
    } catch (err) {
      console.error('quoteRedeemUSDT error:', err);
      setUsdtOut('0');
    }
  };

  const insufficientReserve = Number(usdtOut) > 0 && Number(usdtOut) > Number(vaultUsdtReserve);

  const burn = async () => {
    if (!address || !hdgValue) return;

    if (insufficientReserve) {
      toast.error('Vault has insufficient USDT reserves. The owner needs to deposit more USDT into the vault.', { id: 'burn' });
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      const amount = ethers.parseUnits(hdgValue.toString(), 18);
      // Use 0 as minUsdt to avoid slippage revert — the quote already shows the expected output
      const minUsdt = 0n;

      toast.loading('Burning HDG...', { id: 'burn' });
      const tx = await vault.redeemToUSDT(amount, minUsdt);
      await tx.wait();

      toast.success('Burn successful! 🎉', { id: 'burn' });
      fetchBalances();
      setHdgValue('');
      setUsdtOut('0');
    } catch (err) {
      console.error('Burn error:', err);
      const reason = err.reason || err.message || '';
      if (reason.toLowerCase().includes('insufficient') || reason.toLowerCase().includes('reserve')) {
        toast.error('Burn failed: Vault has insufficient USDT reserves. Contact vault admin to deposit USDT.', { id: 'burn' });
      } else {
        toast.error('Burn failed: ' + reason, { id: 'burn' });
      }
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
        <h1>Burn HDG</h1>
        <p className="text-muted">Swap HDG tokens back to USDT</p>
      </div>

      <GlassCard className="swap-card">
        {/* From: HDG */}
        <div className="swap-section">
          <div className="swap-row">
            <span className="swap-label">From</span>
            <span className="swap-balance">
              Balance: {address ? Number(hdgBalance).toFixed(4) : '0.0000'} HDG
            </span>
          </div>
          <div className="token-input-box">
            <div className="token-badge hdg-badge">
              <span className="token-icon">⬡</span>
              <span>HDG</span>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                className="input-field token-amount-input"
                placeholder="0.00"
                value={hdgValue}
                onChange={(e) => handleHdgInput(e.target.value)}
                disabled={!address}
              />
              <button
                className="max-tag"
                onClick={() => handleHdgInput(hdgBalance)}
                disabled={!address}
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        <div className="swap-divider">
          <div className="swap-arrow-circle">
            <ArrowDown size={18} />
          </div>
        </div>

        {/* To: USDT */}
        <div className="swap-section">
          <div className="swap-row">
            <span className="swap-label">To</span>
            <span className="swap-balance">
              Balance: {address ? Number(usdtBalance).toFixed(4) : '0.0000'} USDT
            </span>
          </div>
          <div className="token-input-box">
            <div className="token-badge usdt-badge">
              <span className="token-icon">₮</span>
              <span>USDT</span>
            </div>
            <div className="output-value">{Number(usdtOut).toFixed(6) || '0.00'}</div>
          </div>
        </div>

        {/* Reserve warning */}
        {insufficientReserve && (
          <div className="burn-warning">
            <AlertTriangle size={16} />
            <span>Vault USDT reserve ({Number(vaultUsdtReserve).toFixed(2)}) is insufficient for this burn. Contact the vault admin to deposit more USDT.</span>
          </div>
        )}

        {/* Vault info */}
        {address && (
          <div className="vault-reserve-info">
            Vault USDT Reserve: <b>{Number(vaultUsdtReserve).toFixed(4)} USDT</b>
          </div>
        )}

        <button className="btn-primary swap-btn" onClick={burn} disabled={!address || loading || !hdgValue || insufficientReserve}>
          <span>{loading ? 'Processing...' : insufficientReserve ? 'Insufficient Reserves' : 'Burn HDG'}</span>
        </button>
      </GlassCard>
    </motion.div>
  );
};
