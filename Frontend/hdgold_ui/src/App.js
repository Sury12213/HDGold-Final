import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { FirstPage } from "./pages/FirstPage";
import { MintPage } from "./pages/MintPage";
import { BurnPage } from "./pages/BurnPage";
import { RedeemPage } from "./pages/RedeemPage";
import { StakingPage } from "./pages/StakingPage";
import { VoucherPage } from "./pages/VoucherPage";
import { VerificationForm as Verify } from "./pages/VerificationForm";
import { WalletProvider } from "./context/WalletContext";

function App() {
  return (
    <WalletProvider>
      <Router>
        <Header />
        <div style={{ padding: "20px", minHeight: "80vh" }}>
          <Routes>
            <Route path="/" element={<FirstPage />} />
            <Route path="/mint" element={<MintPage />} />
            <Route path="/burn" element={<BurnPage />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/staking" element={<StakingPage />} />
            <Route path="/voucher" element={<VoucherPage />} />
            <Route path="/verification" element={<Verify />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </WalletProvider>
  );
}

export default App;
