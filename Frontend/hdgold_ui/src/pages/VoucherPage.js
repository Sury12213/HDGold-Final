import React, { useState, useEffect, useContext } from "react";
import Web3 from "web3";
import { QRCodeCanvas } from "qrcode.react";
import { WalletContext } from "../context/WalletContext";
import {
  STAKING_ADDRESS,
  STAKING_ABI,
  SOVI_ADDRESS,
  SOVI_ABI,
} from "../constants";
import "./VoucherPage.css";

const vouchers = [
  {
    id: 1,
    brand: "VIETJET",
    title: "Vietjet Flight Voucher",
    desc: "500k VND discount",
    price: "50",
    color: "red",
  },
  {
    id: 2,
    brand: "HDBANK",
    title: "HDBank Cashback",
    desc: "1% cashback",
    price: "20",
    color: "blue",
  },
  {
    id: 3,
    brand: "FURAMA",
    title: "Furama Resort Voucher",
    desc: "2M VND discount for booking",
    price: "80",
    color: "green",
  },
  {
    id: 4,
    brand: "BAMBOO",
    title: "Bamboo Airways Ticket",
    desc: "10% off domestic flights",
    price: "70",
    color: "pink",
  },
  {
    id: 5,
    brand: "SOVICO",
    title: "Sovico Lifestyle",
    desc: "Shopping voucher 200k VND",
    price: "30",
    color: "purple",
  },
  {
    id: 6,
    brand: "HDBANK",
    title: "HDBank Loan Fee Discount",
    desc: "0.5% loan processing fee off",
    price: "60",
    color: "orange",
  },
  {
    id: 7,
    brand: "BAMBOO",
    title: "Bamboo Airways Lounge",
    desc: "Free lounge access once",
    price: "40",
    color: "red",
  },
];

export const VoucherPage = () => {
  const { account } = useContext(WalletContext);
  const [web3, setWeb3] = useState(null);
  const [staking, setStaking] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [soviToken, setSoviToken] = useState(null);
  const [soviBalance, setSoviBalance] = useState("0");

  useEffect(() => {
    if (window.ethereum) {
      const w3 = new Web3(window.ethereum);
      setWeb3(w3);
      const stakingC = new w3.eth.Contract(STAKING_ABI, STAKING_ADDRESS);
      const soviC = new w3.eth.Contract(SOVI_ABI, SOVI_ADDRESS);
      setStaking(stakingC);
      setSoviToken(soviC);
      loadBalance(w3, soviC);
    }
  }, [account]);

  const loadBalance = async (w3, soviC) => {
    if (!account || !soviC) return;
    const balance = await soviC.methods.balanceOf(account).call();
    setSoviBalance(w3.utils.fromWei(balance.toString(), "ether"));
  };

  const handleRedeem = async (voucher) => {
    if (!staking || !account) return;
    try {
      const costWei = web3.utils.toWei(voucher.price, "ether");
      await staking.methods
        .redeemVoucher(voucher.id, costWei)
        .send({ from: account });

      // Sinh QR value với tên voucher + 6 mã random
      const randomCode = generateCode();
      const qrCodeValue = `${voucher.title}-${randomCode}`;
      setQrData(qrCodeValue);

      loadBalance(web3, soviToken);
    } catch (err) {
      console.error(err);
      alert("Redeem thất bại!");
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <div className="voucher-page">
      <div className="voucher-header">
        <h1>SOVI Voucher Store</h1>
        <div className="balance-box">
          <span>Your SOVI Balance</span>
          <b>{Number(soviBalance).toFixed(6)} SOVI</b>
        </div>
      </div>

      <div className="voucher-grid">
        {vouchers.map((v) => (
          <div className="voucher-card" key={v.id}>
            <div className={`brand ${v.color}`}>{v.brand}</div>
            <h3>{v.title}</h3>
            <p className="desc">{v.desc}</p>
            <p className="price">{v.price} SOVI</p>
            <button
              className={`exchange-btn ${v.color}`}
              onClick={() => handleRedeem(v)}
            >
              Exchange
            </button>
          </div>
        ))}
      </div>

      {qrData && (
        <div className="qr-popup">
          <div className="qr-content">
            <h3>Voucher Redeemed!</h3>
            <QRCodeCanvas value={qrData} size={200} />
            <p>{qrData}</p>
            <button onClick={() => setQrData(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
