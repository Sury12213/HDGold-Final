import React, { useState, useEffect, useContext, useCallback } from "react";
import Web3 from "web3";
import { WalletContext } from "../context/WalletContext";
import {
  STAKING_ABI,
  STAKING_ADDRESS,
  VAULT_ABI,
  VAULT_ADDRESS,
} from "../constants";
import "./StakingPage.css";

export const StakingPage = () => {
  const { account } = useContext(WalletContext);
  const [web3, setWeb3] = useState(null);
  const [staking, setStaking] = useState(null);
  const [vault, setVault] = useState(null);

  const [totalStaked, setTotalStaked] = useState("0");
  const [myStaked, setMyStaked] = useState("0");
  const [availableHDG, setAvailableHDG] = useState("0");

  const [apy, setApy] = useState("0");
  const [usdtRewards, setUsdtRewards] = useState("0");
  const [soviRewards, setSoviRewards] = useState("0");

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      const w3 = new Web3(window.ethereum);
      setWeb3(w3);
      setStaking(new w3.eth.Contract(STAKING_ABI, STAKING_ADDRESS));
      setVault(new w3.eth.Contract(VAULT_ABI, VAULT_ADDRESS));
    }
  }, []);

  // Function to fetch all staking data
  const fetchStakingInfo = useCallback(async () => {
    if (!account || !staking || !vault || !web3) return;
    try {
      // total staked
      const totalWei = await staking.methods.totalStaked().call();
      setTotalStaked(web3.utils.fromWei(totalWei.toString(), "ether"));

      // my staked
      const userStake = await staking.methods.stakes(account).call();
      setMyStaked(web3.utils.fromWei(userStake.amount.toString(), "ether"));

      // available HDG
      const balance = await vault.methods.balanceOf(account).call();
      setAvailableHDG(web3.utils.fromWei(balance.toString(), "ether"));

      // rewards
      const pending = await staking.methods.pendingRewards(account).call();
      setUsdtRewards(web3.utils.fromWei(pending[0].toString(), "ether"));
      setSoviRewards(web3.utils.fromWei(pending[1].toString(), "ether"));

      // apy
      const rewardRateUSDT = await staking.methods.rewardRateUSDT().call();
      const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
      const apyCalc =
        ((Number(rewardRateUSDT) * SECONDS_PER_YEAR) / 1e18) * 100;
      setApy(apyCalc.toFixed(2));
    } catch (err) {
      console.error("staking fetch error:", err);
    }
  }, [account, staking, vault, web3]);

  useEffect(() => {
    fetchStakingInfo();
  }, [fetchStakingInfo]);

  const handleStake = async () => {
    if (!stakeAmount || !account) return;
    try {
      const amountWei = web3.utils.toWei(stakeAmount, "ether");
      await vault.methods
        .approve(STAKING_ADDRESS, amountWei)
        .send({ from: account });
      await staking.methods.stake(amountWei).send({ from: account });
      alert("✅ Staked successfully");
      fetchStakingInfo();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaim = async () => {
    try {
      await staking.methods.claimRewards().send({ from: account });
      alert("✅ Rewards claimed");
      fetchStakingInfo();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || !account || Number(unstakeAmount) <= 0) return;
    try {
      const amountWei = web3.utils.toWei(unstakeAmount, "ether");
      await staking.methods.unstake(amountWei).send({ from: account });
      alert("✅ Unstaked successfully");
      setUnstakeAmount("");
      fetchStakingInfo();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="staking-page">
      <h1 className="page-title">HDG Staking</h1>
      <p className="page-subtitle">
        Stake HDG tokens and earn USDT rewards + SOVI points
      </p>

      <div className="staking-layout">
        {/* Left Dashboard */}
        <div className="dashboard">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Staked in Pool</h3>
              <p className="value">{Number(totalStaked).toFixed(2)} HDG</p>
            </div>

            <div className="stat-card">
              <h3>Current APY</h3>
              <p className="value green">{apy}%</p>
              <span className="sub">Annual Percentage Yield</span>
            </div>

            <div className="stat-card">
              <h3>My Staked</h3>
              <p className="value">{Number(myStaked).toFixed(2)} HDG</p>
            </div>

            <div className="stat-card">
              <h3>My Rewards</h3>
              <p className="value">{Number(usdtRewards).toFixed(6)} USDT</p>
              <p className="value">{Number(soviRewards).toFixed(6)} SOVI</p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="actions">
          <div className="stake-box">
            <h3>Stake HDG Tokens</h3>
            <div className="input-row">
              <input
                type="number"
                placeholder="0.00 HDG"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <button
                className="max-btn"
                onClick={() => setStakeAmount(availableHDG)}
              >
                MAX
              </button>
            </div>
            <p className="sub">
              Available: {Number(availableHDG).toFixed(2)} HDG
            </p>
            <button className="stake-btn" onClick={handleStake}>
              Stake HDG
            </button>
          </div>

          <div className="position-box">
            <h3>My Staking Position</h3>
            <p>
              Staked Amount: <b>{Number(myStaked).toFixed(2)} HDG</b>
            </p>
            <p>
              USDT Rewards: <b>{Number(usdtRewards).toFixed(6)} USDT</b>
            </p>
            <p>
              SOVI Points: <b>{Number(soviRewards).toFixed(6)}</b>
            </p>

            <div className="unstake-section">
              <h4>Unstake HDG</h4>
              <div className="input-row">
                <input
                  type="number"
                  placeholder="0.00 HDG"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                />
                <button
                  className="max-btn"
                  onClick={() => setUnstakeAmount(myStaked)}
                >
                  MAX
                </button>
              </div>
              <button className="unstake-btn" onClick={handleUnstake}>
                Unstake HDG
              </button>
            </div>

            <button className="claim-btn" onClick={handleClaim}>
              Claim Rewards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
