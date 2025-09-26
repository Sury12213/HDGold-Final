import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./FirstPage.css";
import { WalletContext } from "../context/WalletContext";
import KycSBTAbi from "../abis/SoulboundKYC.json";

const KYC_SBT_ADDRESS = "0x33FEcC1536d8714499340b99545D54784096aE2C";

export const FirstPage = () => {
  const { account } = useContext(WalletContext);
  const [isKycDone, setIsKycDone] = useState(false);
  const navigate = useNavigate();

  const checkKyc = async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        KYC_SBT_ADDRESS,
        KycSBTAbi,
        provider
      );

      const kycStatus = await contract.hasKYC(account);
      setIsKycDone(kycStatus);
    } catch (err) {
      console.error("Error checking KYC:", err);
    }
  };

  useEffect(() => {
    checkKyc();
  }, [account]);

  return (
    <div className="first-page">
      <div className="content-container">
        <div className="xaum-mint-card">
          <div className="card-header">
            <div className="logo-circle">HDG</div>
            <h2 className="brand-name">HDGold</h2>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-info">
                <div className="step-number">1</div>
                <span>Complete Verification (KYC)</span>
              </div>
              {isKycDone ? (
                <span className="tick">✅</span>
              ) : (
                <button
                  className="action-btn"
                  onClick={() => navigate("/verification")}
                >
                  Verify
                </button>
              )}
            </div>

            <div className="step">
              <div className="step-info">
                <div className="step-number">2</div>
                <span>Connect your Web3 wallet</span>
              </div>
              {account ? <span className="tick">✅</span> : <span>❌</span>}
            </div>
          </div>

          <button className="mint-button" onClick={() => navigate("/mint")}>
            Start to Mint
          </button>
        </div>
      </div>
    </div>
  );
};
