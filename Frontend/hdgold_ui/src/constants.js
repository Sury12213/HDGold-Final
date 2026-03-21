import vaultAbiJson from './abis/HDGoldVault.json';
import kycAbiJson from './abis/SoulboundKYC.json';
import stakingAbiJson from './abis/HDGoldStaking.json';
import soviAbiJson from './abis/SovicoToken.json';
import priceAbiJson from './abis/PriceFeeder.json';

export const VAULT_ADDRESS = '0xa7440675ba7CB263dB1Fc2fb54818E8A18FF96c1';
export const VAULT_ABI = vaultAbiJson;

export const USDT_ADDRESS = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';

export const KYC_ADDRESS = '0x33FEcC1536d8714499340b99545D54784096aE2C';
export const KYC_ABI = kycAbiJson;

export const STAKING_ADDRESS = '0x61eb33871DC0c963b14FC412C419acE22d156522';
export const STAKING_ABI = stakingAbiJson;

export const SOVI_ADDRESS = '0xec92ad3Cb33eB96511aCd2ba467DbF4e63819210';
export const SOVI_ABI = soviAbiJson;

export const PRICE_FEEDER_ADDRESS = '0x570b30768B77709686afA1F8c7d3AE42cb35aa41';
export const PRICE_FEEDER_ABI = priceAbiJson;

// ERC20 minimal ABI for balanceOf + approve
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// Token metadata for wallet_watchAsset
export const TOKENS = {
  HDG: {
    address: VAULT_ADDRESS,
    symbol: 'HDG',
    decimals: 18,
    image: '',
  },
  USDT: {
    address: USDT_ADDRESS,
    symbol: 'USDT',
    decimals: 18,
    image: '',
  },
  SOVI: {
    address: SOVI_ADDRESS,
    symbol: 'SOVI',
    decimals: 18,
    image: '',
  },
};
