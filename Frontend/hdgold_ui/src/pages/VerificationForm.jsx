import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShieldCheck, User, CreditCard, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { KYC_ADDRESS, KYC_ABI } from '../constants';
import './VerificationForm.css';

const KYC_SERVER = import.meta.env.VITE_KYC_SERVER_URL || 'http://localhost:4000';

export const VerificationForm = () => {
  const { address } = useAccount();
  const [idCard, setIdCard] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [kycStatus, setKycStatus] = useState('none'); // none | pending | rejected | verified

  // Check KYC status (on-chain + server)
  const checkKycStatus = useCallback(async () => {
    if (!address) {
      setFetching(false);
      return;
    }
    try {
      // Check on-chain first
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const kyc = new ethers.Contract(KYC_ADDRESS, KYC_ABI, provider);
        const verified = await kyc.hasKYC(address);
        if (verified) {
          setKycStatus('verified');
          setFetching(false);
          return;
        }
      }

      // Check server for pending/rejected
      const res = await fetch(`${KYC_SERVER}/kyc/status/${address}`);
      const data = await res.json();
      if (data.success && data.status) {
        setKycStatus(data.status); // 'pending', 'rejected', or 'none'
      }
    } catch (err) {
      console.error('KYC status check error:', err);
    } finally {
      setFetching(false);
    }
  }, [address]);

  useEffect(() => { checkKycStatus(); }, [checkKycStatus]);

  // Polling: re-check status every 10s when pending
  useEffect(() => {
    if (kycStatus !== 'pending') return;
    const interval = setInterval(checkKycStatus, 10000);
    return () => clearInterval(interval);
  }, [kycStatus, checkKycStatus]);

  const handleSubmit = async () => {
    if (!address) return toast.error('Please connect wallet first');
    if (!idCard) return toast.error('Please upload ID Card image');
    if (!selfie) return toast.error('Please upload Selfie image');

    try {
      setLoading(true);
      toast.loading('Uploading & submitting KYC...', { id: 'kyc' });

      const formData = new FormData();
      formData.append('wallet', address);
      formData.append('idCard', idCard);
      formData.append('selfie', selfie);

      const res = await fetch(`${KYC_SERVER}/kyc/submit`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success('KYC submitted! Waiting for admin review 📋', { id: 'kyc' });
        setKycStatus('pending');
      } else {
        toast.error(data.error || 'Submission failed', { id: 'kyc' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error: ' + err.message, { id: 'kyc' });
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = () => {
    setKycStatus('none');
    setIdCard(null);
    setSelfie(null);
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10vh' }}>
        <LoadingSpinner text="Checking KYC status..." />
      </div>
    );
  }

  // ===== VERIFIED STATE =====
  if (kycStatus === 'verified') {
    return (
      <motion.div
        className="verify-container"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="page-header">
          <h1>Identity Verification</h1>
          <p className="text-muted">Your identity has been verified</p>
        </div>

        <GlassCard className="verified-card">
          <div className="verified-icon-wrapper">
            <CheckCircle size={64} />
          </div>
          <h2>You are Verified ✅</h2>
          <p className="text-muted">
            Your KYC verification is complete. You have been issued a Soulbound Token (SBT) that proves your identity on-chain.
          </p>
          <div className="verified-details">
            <div className="verified-row">
              <span>Wallet</span>
              <b>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</b>
            </div>
            <div className="verified-row">
              <span>Status</span>
              <span className="verified-badge">✓ Verified</span>
            </div>
            <div className="verified-row">
              <span>SBT Contract</span>
              <b style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{KYC_ADDRESS}</b>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // ===== PENDING STATE =====
  if (kycStatus === 'pending') {
    return (
      <motion.div
        className="verify-container"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="page-header">
          <h1>Identity Verification</h1>
          <p className="text-muted">Your submission is being reviewed</p>
        </div>

        <GlassCard className="pending-card">
          <div className="pending-icon-wrapper">
            <Clock size={64} />
          </div>
          <h2>Pending Review ⏳</h2>
          <p className="text-muted">
            Your KYC documents have been submitted and are waiting for admin review.
            This page will automatically update when your verification is complete.
          </p>
          <div className="pending-loader">
            <div className="pending-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // ===== REJECTED STATE =====
  if (kycStatus === 'rejected') {
    return (
      <motion.div
        className="verify-container"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="page-header">
          <h1>Identity Verification</h1>
          <p className="text-muted">Your submission was rejected</p>
        </div>

        <GlassCard className="rejected-card">
          <div className="rejected-icon-wrapper">
            <XCircle size={64} />
          </div>
          <h2>Verification Rejected ❌</h2>
          <p className="text-muted">
            Your KYC submission was rejected. Please ensure your ID document is clear and your selfie matches.
          </p>
          <button className="btn-primary resubmit-btn" onClick={handleResubmit}>
            <RotateCcw size={18} />
            <span>Re-submit Documents</span>
          </button>
        </GlassCard>
      </motion.div>
    );
  }

  // ===== UPLOAD FORM (status === 'none') =====
  return (
    <motion.div
      className="verify-container"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <h1>Identity Verification</h1>
        <p className="text-muted">Complete KYC to access all platform features</p>
      </div>

      <GlassCard className="verify-card">
        <div className="verify-steps">
          <div className="verify-step">
            <div className="step-number">1</div>
            <span>Connect Wallet</span>
            {address ? (
              <span className="step-status done">✓ Connected</span>
            ) : (
              <span className="step-status pending">Pending</span>
            )}
          </div>
          <div className="verify-step">
            <div className="step-number">2</div>
            <span>Upload Documents</span>
            {idCard && selfie ? (
              <span className="step-status done">✓ Ready</span>
            ) : (
              <span className="step-status pending">Pending</span>
            )}
          </div>
          <div className="verify-step">
            <div className="step-number">3</div>
            <span>Admin Review & SBT</span>
            <span className="step-status pending">Pending</span>
          </div>
        </div>

        <div className="upload-grid">
          <label className={`upload-box glass-card ${idCard ? 'has-file' : ''}`} htmlFor="id-upload">
            <input
              id="id-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setIdCard(e.target.files[0] || null)}
              style={{ display: 'none' }}
            />
            <CreditCard size={28} className="upload-icon" />
            <div className="upload-label">Upload ID Document</div>
            <div className="upload-sub">
              {idCard ? `✓ ${idCard.name}` : 'CCCD/CMND (PNG, JPG up to 10MB)'}
            </div>
          </label>

          <label className={`upload-box glass-card ${selfie ? 'has-file' : ''}`} htmlFor="selfie-upload">
            <input
              id="selfie-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setSelfie(e.target.files[0] || null)}
              style={{ display: 'none' }}
            />
            <User size={28} className="upload-icon" />
            <div className="upload-label">Upload Selfie</div>
            <div className="upload-sub">
              {selfie ? `✓ ${selfie.name}` : 'Clear face photo (PNG, JPG up to 10MB)'}
            </div>
          </label>
        </div>

        <button
          className="btn-primary verify-submit-btn"
          onClick={handleSubmit}
          disabled={loading || !address || !idCard || !selfie}
        >
          <ShieldCheck size={18} />
          <span>{loading ? 'Uploading...' : 'Submit Verification'}</span>
        </button>
      </GlassCard>
    </motion.div>
  );
};
