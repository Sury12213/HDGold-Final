import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { MintPage } from './pages/MintPage';
import { BurnPage } from './pages/BurnPage';
import { RedeemPage } from './pages/RedeemPage';
import { StakingPage } from './pages/StakingPage';
import { VoucherPage } from './pages/VoucherPage';
import { VerificationForm } from './pages/VerificationForm';
import { FaucetPage } from './pages/FaucetPage';
import { Footer } from './components/Footer';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--dark-700)',
            color: '#e0e0e0',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
          },
          success: {
            iconTheme: { primary: 'var(--color-success)', secondary: 'var(--dark-700)' },
          },
          error: {
            iconTheme: { primary: 'var(--color-error)', secondary: 'var(--dark-700)' },
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/mint" element={<MintPage />} />
          <Route path="/burn" element={<BurnPage />} />
          <Route path="/redeem" element={<RedeemPage />} />
          <Route path="/staking" element={<StakingPage />} />
          <Route path="/voucher" element={<VoucherPage />} />
          <Route path="/verification" element={<VerificationForm />} />
          <Route path="/faucet" element={<FaucetPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </Layout>
    </>
  );
}

export default App;
