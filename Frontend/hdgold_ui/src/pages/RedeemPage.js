import React, { useState, useEffect, useContext, useCallback } from "react";
import Web3 from "web3";
import { QRCodeCanvas } from "qrcode.react";
import { WalletContext } from "../context/WalletContext";
import { VAULT_ABI, VAULT_ADDRESS, KYC_ABI, KYC_ADDRESS } from "../constants";
import "./RedeemPage.css";

export const RedeemPage = () => {
  const { account } = useContext(WalletContext);
  const [web3, setWeb3] = useState(null);
  const [vault, setVault] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [hdgBalance, setHdgBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kycTokenId, setKycTokenId] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const w3 = new Web3(window.ethereum);
      setWeb3(w3);
      setVault(new w3.eth.Contract(VAULT_ABI, VAULT_ADDRESS));
      setKyc(new w3.eth.Contract(KYC_ABI, KYC_ADDRESS));
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!account || !vault || !web3) return;
    try {
      // HDG balance
      const bal = await vault.methods.balanceOf(account).call();
      setHdgBalance(web3.utils.fromWei(bal.toString(), "ether"));

      if (kyc) {
        try {
          const tokenId = await kyc.methods
            .tokenOfOwnerByIndex(account, 0)
            .call();
          setKycTokenId(tokenId);
        } catch (err) {
          console.warn("User chưa có KYC NFT");
        }
      }
    } catch (err) {
      console.error("fetch data error:", err);
    }
  });

  useEffect(() => {
    fetchData();
  }, [account, vault, kyc, web3, fetchData]);

  const handleInput = (val) => {
    // chỉ nhận số nguyên dương
    if (/^\d*$/.test(val)) {
      setAmount(val);
    }
  };

  const handleRedeem = async () => {
    if (!account || !amount || amount === "0") return;
    try {
      setLoading(true);
      const amountWei = web3.utils.toWei(amount.toString(), "ether");
      const tx = await vault.methods
        .redeemPhysical(amountWei)
        .send({ from: account });

      const payload = {
        txHash: tx.transactionHash,
        user: account,
        amount: `${amount} HDG`,
        kycTokenId: kycTokenId || "N/A",
        timestamp: Date.now(),
      };
      setQrData(JSON.stringify(payload));
      fetchData();
    } catch (err) {
      console.error("redeem error:", err);
      alert("❌ Redeem thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="redeem-page">
      <div className="redeem-card">
        {/* Header */}
        <div className="header-section">
          <h2 className="title">Redeem HDG</h2>
          <p className="subtitle">
            Enter the amount of HDG tokens you want to redeem
          </p>
        </div>

        {/* Input section */}
        <div className="input-section">
          <div className="amount-label">
            <span className="label">HDG Amount</span>
            <span className="available">
              Available: {Number(hdgBalance).toFixed(4)} HDG
            </span>
          </div>

          <div className="amount-input">
            <input
              type="text"
              placeholder="Enter amount (e.g., 1, 2, 3...)"
              value={amount}
              onChange={(e) => handleInput(e.target.value)}
            />
          </div>

          <div className="quick-amount-buttons">
            <button className="amount-btn" onClick={() => setAmount("1")}>
              1
            </button>
            <button className="amount-btn" onClick={() => setAmount("2")}>
              2
            </button>
            <button className="amount-btn" onClick={() => setAmount("5")}>
              5
            </button>
            <button
              className="amount-btn max"
              onClick={() => setAmount(Math.floor(hdgBalance))}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Info section */}
        <div className="info-section">
          <div className="info-header">Redeem Information</div>
          <p className="info-text">
            Each HDG token represents 1 tael of physical gold. Redeemed tokens
            will be burned and physical gold will be delivered.
          </p>
        </div>

        {/* Button */}
        <button
          className="redeem-button"
          onClick={handleRedeem}
          disabled={loading || !account}
        >
          {loading ? "Processing..." : "Redeem HDG"}
        </button>

        {/* QR Code */}
        {qrData && (
          <div className="qr-popup">
            <div className="qr-content">
              <h4>🎉 Scan this QR at HDBank to claim your gold</h4>
              <div className="qr-canvas">
                <QRCodeCanvas value={qrData} size={200} />
              </div>
              <button onClick={() => setQrData(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
