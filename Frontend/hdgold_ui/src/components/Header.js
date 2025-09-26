import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ethers } from "ethers";
import "./Header.css";
import logo from "../assets/images/logo.png";
import { WalletContext } from "../context/WalletContext";
import { PRICE_FEEDER_ADDRESS, PRICE_FEEDER_ABI } from "../constants";

export const Header = () => {
  const { account, setAccount } = useContext(WalletContext);
  const [chiPrice, setChiPrice] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } else {
      alert("Please install MetaMask!");
    }
  };

  // fetch giá VND/chi
  useEffect(() => {
    const fetchChiPrice = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          PRICE_FEEDER_ADDRESS,
          PRICE_FEEDER_ABI,
          provider
        );
        const value = await contract.getChiVnd();
        const price = Number(ethers.formatUnits(value, 18));
        setChiPrice(price.toFixed(0));
      } catch (err) {
        console.error("Error fetching chi price:", err);
        setChiPrice(null);
      }
    };

    fetchChiPrice();
    const interval = setInterval(fetchChiPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="header">
      <div className="left-section">
        <div className="logo">
          <img src={logo} alt="HDGold Logo" className="logo-img" />
          <div className="brand-name">HDGold</div>
        </div>

        <div className="navbar">
          <NavLink to="/mint" className="nav-item">
            Mint
          </NavLink>
          <NavLink to="/burn" className="nav-item">
            Burn
          </NavLink>
          <NavLink to="/redeem" className="nav-item">
            Redeem
          </NavLink>
          <NavLink to="/staking" className="nav-item">
            Staking
          </NavLink>
          <NavLink to="/voucher" className="nav-item">
            Voucher
          </NavLink>
          <NavLink to="/verification" className="nav-item">
            Verification
          </NavLink>
        </div>
      </div>

      <div className="right-section">
        {chiPrice ? (
          <div className="gold-price">
            {Number(chiPrice).toLocaleString()} VND / chỉ
          </div>
        ) : (
          <div className="gold-price">-- VND / chỉ</div>
        )}
        {account ? (
          <div className="connect-button">
            <div className="connect-text">
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          </div>
        ) : (
          <div className="connect-button" onClick={connectWallet}>
            <div className="connect-text">Connect</div>
          </div>
        )}
      </div>
    </div>
  );
};
