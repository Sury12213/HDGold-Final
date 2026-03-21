import { useCallback } from 'react';

/**
 * Hook to prompt user to add a token to their wallet via wallet_watchAsset
 */
export function useAddToken() {
  const addToken = useCallback(async (token) => {
    if (!window.ethereum) return false;
    try {
      const added = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
            image: token.image || '',
          },
        },
      });
      return added;
    } catch (err) {
      console.error('Failed to add token:', err);
      return false;
    }
  }, []);

  return { addToken };
}
