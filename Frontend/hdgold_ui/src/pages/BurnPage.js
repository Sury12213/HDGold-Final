import React, { useContext, useEffect, useState } from "react";
import { WalletContext } from "../context/WalletContext";
import Web3 from "web3";
import { VAULT_ADDRESS, VAULT_ABI, USDT_ADDRESS } from "../constants";
import "./BurnPage.css";

export const BurnPage = () => {
  const { account } = useContext(WalletContext);
  const [web3, setWeb3] = useState(null);
  const [vault, setVault] = useState(null);
  const [usdt, setUsdt] = useState(null);

  const [hdgBalance, setHdgBalance] = useState("0");
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [hdgValue, setHdgValue] = useState("");
  const [usdtOut, setUsdtOut] = useState("0");

  useEffect(() => {
    if (window.ethereum) {
      const w3 = new Web3(process.env.REACT_APP_RPC_URL || window.ethereum);
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
      window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x61" }],
      });
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

  const handleHdgInput = async (val) => {
    setHdgValue(val);

    if (!vault || !val || Number(val) <= 0) {
      setUsdtOut("0");
      return;
    }

    try {
      const hdgInput = web3.utils.toWei(val.toString(), "ether");
      const result = await vault.methods.quoteRedeemUSDT(hdgInput).call();
      setUsdtOut(web3.utils.fromWei(result[0].toString(), "ether"));
    } catch (err) {
      console.error("quoteRedeemUSDT error:", err);
      setUsdtOut("0");
    }
  };

  const burn = async () => {
    if (!account || !hdgValue) return;
    try {
      const amount = web3.utils.toWei(hdgValue.toString(), "ether");
      const minUsdtAmount = web3.utils.toWei(usdtOut.toString(), "ether");

      await vault.methods
        .redeemToUSDT(amount, minUsdtAmount)
        .send({ from: account });
      alert("✅ Burn thành công");
    } catch (err) {
      console.error("Burn error:", err);
    }
  };

  return (
    <div className="burn-page">
      <div className="burn-card">
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
              Balance: {account ? Number(hdgBalance).toFixed(4) : "0.0000"} HDG
            </span>
          </div>
        </div>

        {/* Token Input HDG */}
        <div className="token-box">
          <div className="token-info">
            <div className="token-symbol hdg">HDG</div>
            <div className="token-details">
              <div className="token-name">HDG</div>
              <div className="chain">BNB Chain Testnet</div>
            </div>
          </div>
          <div className="amount-input-inline">
            <input
              type="number"
              placeholder="0.00"
              value={hdgValue}
              onChange={(e) => handleHdgInput(e.target.value)}
              disabled={!account}
            />
            <button
              className="max-btn"
              onClick={() => handleHdgInput(hdgBalance)}
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
          <div className="amount">{usdtOut || "0.00"}</div>
        </div>

        {/* Button */}
        <button className="mint-button" onClick={burn} disabled={!account}>
          Burn
        </button>
      </div>
    </div>
  );
};
