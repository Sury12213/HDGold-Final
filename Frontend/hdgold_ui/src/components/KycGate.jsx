import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';
import { KYC_ADDRESS, KYC_ABI } from '../constants';
import './KycGate.css';

const RPC_URL = 'https://bsc-testnet-rpc.publicnode.com';

export const KycGate = ({ children }) => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [hasKyc, setHasKyc] = useState(null); // null = loading
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkKyc = async () => {
      if (!address) { setHasKyc(false); return; }
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(KYC_ADDRESS, KYC_ABI, provider);
        const result = await contract.hasKYC(address);
        setHasKyc(result);
      } catch (err) {
        console.error('KYC check error:', err);
        setHasKyc(false);
      }
    };
    checkKyc();
  }, [address]);

  // Don't show gate if not connected, loading, has KYC, or dismissed
  if (!isConnected || hasKyc === null || hasKyc || dismissed) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="kyc-gate-banner">
        <div className="kyc-gate-content">
          <ShieldAlert size={20} className="kyc-gate-icon" />
          <span className="kyc-gate-text">
            KYC verification is required to use this feature.
          </span>
          <button
            className="kyc-gate-link"
            onClick={() => navigate('/verification')}
          >
            Go to KYC <ArrowRight size={14} />
          </button>
        </div>
        <button
          className="kyc-gate-close"
          onClick={() => setDismissed(true)}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </>
  );
};
