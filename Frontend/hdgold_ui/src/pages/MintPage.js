import React, { useContext, useEffect, useState } from "react";
import { WalletContext } from "../context/WalletContext";
import Web3 from "web3";
import { VAULT_ADDRESS, VAULT_ABI, USDT_ADDRESS } from "../constants";
import "./MintPage.css";

export const MintPage = () => {
  const { account } = useContext(WalletContext);
  const [web3, setWeb3] = useState(null);
  const [vault, setVault] = useState(null);
  const [usdt, setUsdt] = useState(null);

  const [usdtBalance, setUsdtBalance] = useState("0");
  const [hdgBalance, setHdgBalance] = useState("0");
  const [usdtValue, setUsdtValue] = useState("");
  const [hdgValue, setHdgValue] = useState("0");

  useEffect(() => {
    if (window.ethereum) {
      const w3 = new Web3(window.ethereum);
      setWeb3(w3);
      setVault(new w3.eth.Contract(VAULT_ABI, VAULT_ADDRESS));
      setUsdt(
        new w3.eth.Contract(
          [
            {
              constant: true,
              inputs: [{ name: "_owner", type: "address" }],
              name: "balanceOf",
              outputs: [{ type: "uint256" }],
              type: "function",
            },
            {
              constant: false,
              inputs: [
                { name: "_spender", type: "address" },
                { name: "_value", type: "uint256" },
              ],
              name: "approve",
              outputs: [{ type: "bool" }],
              type: "function",
            },
          ],
          USDT_ADDRESS
        )
      );
    }
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!account || !usdt || !vault) return;
      const usdtBal = await usdt.methods.balanceOf(account).call();
      setUsdtBalance(web3.utils.fromWei(usdtBal, "ether"));

      const hdgBal = await vault.methods.balanceOf(account).call();
      setHdgBalance(web3.utils.fromWei(hdgBal, "ether"));
    };
    fetchBalances();
  }, [account, usdt, vault]);

  const handleUsdtInput = async (val) => {
    setUsdtValue(val);

    if (!vault || !val || val === "0" || val === "0.") {
      setHdgValue("0");
      return;
    }

    try {
      const usdtInput = web3.utils.toWei(val.toString(), "ether");
      const result = await vault.methods.quoteChiFromUSDT(usdtInput).call();
      setHdgValue(web3.utils.fromWei(result[0].toString(), "ether"));
    } catch (err) {
      console.error("quoteChiFromUSDT error:", err);
      setHdgValue("0");
    }
  };

  const mint = async () => {
    if (!account || !usdtValue) return;
    try {
      const amount = web3.utils.toWei(usdtValue.toString(), "ether");
      await usdt.methods.approve(VAULT_ADDRESS, amount).send({ from: account });
      await vault.methods.mintByUSDT(amount).send({ from: account });
      alert("✅ Mint thành công");
    } catch (err) {
      console.error("Mint error:", err);
    }
  };

  return (
    <div className="mint-page">
      <div className="mint-card">
        {/* From Section */}
        <div className="row">
          <div className="row-left">
            <span className="label">From:</span>
            <span className="address">
              {account
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : "Not connected"}
            </span>
          </div>
          <div className="row-right">
            <span className="balance">
              Balance: {account ? Number(usdtBalance).toFixed(4) : "0.0000"}{" "}
              USDT
            </span>
          </div>
        </div>

        {/* Token Input USDT */}
        <div className="token-box">
          <div className="token-info">
            <div className="token-symbol usdt">₮</div>
            <div className="token-details">
              <div className="token-name">USDT</div>
              <div className="chain">BNB Chain Testnet</div>
            </div>
          </div>
          <div className="amount-input-inline">
            <input
              type="number"
              placeholder="0.00"
              value={usdtValue}
              onChange={(e) => handleUsdtInput(e.target.value)}
              disabled={!account}
            />
            <button
              className="max-btn"
              onClick={() => handleUsdtInput(usdtBalance)}
              disabled={!account}
            >
              Max
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div className="arrow">↓</div>

        {/* To Section */}
        <div className="row">
          <div className="row-left">
            <span className="label">To:</span>
            <span className="address">
              {account
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : "Not connected"}
            </span>
          </div>
          <div className="row-right">
            <span className="balance">
              Balance: {account ? Number(hdgBalance).toFixed(4) : "0.0000"} HDG
            </span>
          </div>
        </div>

        {/* Token Input HDG */}
        <div className="token-box">
          <div className="token-info">
            <div className="token-symbol hdg">HD</div>
            <div className="token-details">
              <div className="token-name">HDG</div>
              <div className="chain">BNB Chain Testnet</div>
            </div>
          </div>
          <div className="amount">{hdgValue || "0.00"}</div>
        </div>

        {/* Button */}
        <button className="mint-button" onClick={mint} disabled={!account}>
          Mint
        </button>
      </div>
    </div>
  );
};
