import React, { useState, useContext } from "react";
import { WalletContext } from "../context/WalletContext";
import "./VerificationForm.css";

export const VerificationForm = () => {
  const { account } = useContext(WalletContext);
  const [idCard, setIdCard] = useState(null);
  const [face, setFace] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!account) return alert("❌ Please connect wallet first");
    if (!idCard || !face) return alert("❌ Please upload both images");

    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/kyc/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: account }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ KYC successful! Token minted. Tx: " + data.txHash);
        localStorage.setItem("kycDone", "true");
      } else {
        alert("❌ Mint failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-form">
      <div className="card">
        <h2 className="title">Identity & Liveness Verification</h2>
        <p className="desc">
          Please upload your identification document and face photo.
        </p>

        <div className="upload-areas">
          <label className="upload-box">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setIdCard(Array.from(e.target.files))}
            />
            <div>
              <div className="upload-title">Upload ID Document</div>
              <div className="upload-sub">
                {idCard && idCard.length > 0
                  ? idCard.map((f) => f.name).join(", ")
                  : "Upload front & back (PNG, JPG up to 10MB)"}
              </div>
            </div>
          </label>

          <label className="upload-box">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFace(e.target.files[0])}
            />
            <div>
              <div className="upload-title">Upload Face Photo</div>
              <div className="upload-sub">
                {face ? face.name : "PNG, JPG up to 10MB"}
              </div>
            </div>
          </label>
        </div>

        <button
          className="continue-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Processing..." : "Continue"}
        </button>
      </div>
    </div>
  );
};
