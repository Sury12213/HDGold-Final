import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Droplets, ExternalLink, Coins, Wallet } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAddToken } from '../hooks/useAddToken';
import { USDT_ADDRESS, ERC20_ABI, VAULT_ADDRESS, VAULT_ABI, TOKENS } from '../constants';
import './FaucetPage.css';

export const FaucetPage = () => {
  const { address } = useAccount();
  const { addToken } = useAddToken();
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [hdgBalance, setHdgBalance] = useState('0');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !window.ethereum) { setFetching(false); return; }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
        const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
        const [uBal, hBal] = await Promise.all([
          usdt.balanceOf(address),
          vault.balanceOf(address),
        ]);
        setUsdtBalance(ethers.formatUnits(uBal, 18));
        setHdgBalance(ethers.formatUnits(hBal, 18));
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchBalances();
  }, [address]);

  const handleAddUSDT = async () => {
    const added = await addToken(TOKENS.USDT);
    if (added) toast.success('USDT token added to wallet!');
  };

  const handleAddHDG = async () => {
    const added = await addToken(TOKENS.HDG);
    if (added) toast.success('HDG token added to wallet!');
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
      className="faucet-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <h1>Testnet Faucet</h1>
        <p className="text-muted">Get test tokens and BNB to try HDGold on BSC Testnet</p>
      </div>

      {/* Balances */}
      {address && (
        <div className="faucet-balances">
          <GlassCard className="faucet-balance-card">
            <Coins size={20} style={{ color: '#26A17B' }} />
            <div>
              <span className="fb-label">Test USDT</span>
              <span className="fb-value">{Number(usdtBalance).toFixed(4)}</span>
            </div>
          </GlassCard>
          <GlassCard className="faucet-balance-card">
            <Coins size={20} style={{ color: 'var(--gold-500)' }} />
            <div>
              <span className="fb-label">HDG</span>
              <span className="fb-value">{Number(hdgBalance).toFixed(4)}</span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* BNB Faucet */}
      <GlassCard className="faucet-card">
        <div className="faucet-card-header">
          <Droplets size={24} style={{ color: '#F0B90B' }} />
          <div>
            <h3>BNB Testnet Faucet</h3>
            <p className="text-muted">Get free tBNB for gas fees</p>
          </div>
        </div>
        <p className="faucet-desc">
          You need tBNB to pay gas fees on BSC Testnet. Visit the official BNB faucet to request free test BNB.
        </p>
        <a
          href="https://www.bnbchain.org/en/testnet-faucet"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary faucet-link-btn"
        >
          <span>Open BNB Faucet</span>
          <ExternalLink size={16} />
        </a>
      </GlassCard>

      {/* USDT Info */}
      <GlassCard className="faucet-card">
        <div className="faucet-card-header">
          <Coins size={24} style={{ color: '#26A17B' }} />
          <div>
            <h3>Test USDT</h3>
            <p className="text-muted">Add test USDT token to your wallet</p>
          </div>
        </div>
        <div className="token-address-box">
          <span className="ta-label">Contract Address:</span>
          <code className="ta-address">{USDT_ADDRESS}</code>
        </div>
        <button className="btn-secondary" onClick={handleAddUSDT} disabled={!address}>
          <Wallet size={16} />
          Add USDT to Wallet
        </button>
      </GlassCard>

      {/* HDG Info */}
      <GlassCard className="faucet-card">
        <div className="faucet-card-header">
          <Coins size={24} style={{ color: 'var(--gold-500)' }} />
          <div>
            <h3>HDG Token</h3>
            <p className="text-muted">Add HDG token to your wallet</p>
          </div>
        </div>
        <div className="token-address-box">
          <span className="ta-label">Contract Address:</span>
          <code className="ta-address">{VAULT_ADDRESS}</code>
        </div>
        <button className="btn-secondary" onClick={handleAddHDG} disabled={!address}>
          <Wallet size={16} />
          Add HDG to Wallet
        </button>
      </GlassCard>

      {/* Instructions */}
      <GlassCard className="faucet-card instructions">
        <h3>How to Get Started</h3>
        <ol className="faucet-steps">
          <li>Connect your wallet (MetaMask, WalletConnect, etc.)</li>
          <li>Switch to BSC Testnet network</li>
          <li>Get free tBNB from the faucet above</li>
          <li>Add USDT & HDG tokens to your wallet</li>
          <li>Complete KYC verification</li>
          <li>Start minting and staking HDG!</li>
        </ol>
      </GlassCard>
    </motion.div>
  );
};
