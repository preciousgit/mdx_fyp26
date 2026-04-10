declare global {
  interface Window { ethereum?: any; }
}

export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const FEE_ETH = 0.00025;
// 0.00025 ETH = 250,000,000,000,000 wei
export const FEE_WEI = '0xe35fa931a000';

// Set VITE_FEE_RECIPIENT in your .env to your Sepolia wallet that receives platform fees
export const FEE_RECIPIENT =
  import.meta.env.VITE_FEE_RECIPIENT || '0x000000000000000000000000000000000000dEaD';

/**
 * Picks the MetaMask provider even when multiple wallet extensions are installed.
 * Falls back to window.ethereum if no specific MetaMask provider is detected.
 */
function getProvider(): any {
  if (!window.ethereum) return null;
  // EIP-6963 / multi-provider: some setups expose window.ethereum.providers[]
  if (Array.isArray(window.ethereum.providers)) {
    const mm = window.ethereum.providers.find((p: any) => p.isMetaMask);
    if (mm) return mm;
  }
  // Single provider — make sure it's MetaMask (or at least ethereum-compatible)
  return window.ethereum;
}

async function switchToSepolia(provider: any) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      // Chain not yet added — add it using reliable public RPCs only
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SEPOLIA_CHAIN_ID,
          chainName: 'Sepolia Test Network',
          rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'],
          nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      });
    } else if (err.code === 4001) {
      throw new Error('Please switch to the Sepolia test network in MetaMask.');
    } else {
      throw new Error('Failed to switch to Sepolia: ' + (err.message || ''));
    }
  }
}

/**
 * Connect MetaMask on Sepolia.
 * Order: request accounts FIRST (grants site access), THEN switch network.
 * Returns the lowercased wallet address.
 */
export async function connectWallet(): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('MetaMask not found. Please install the MetaMask browser extension and refresh.');
  }
  if (!provider.isMetaMask && !provider.isConnected) {
    throw new Error('Could not detect MetaMask. Make sure it is enabled and try again.');
  }

  // 1. Request account access — triggers the MetaMask popup
  let accounts: string[];
  try {
    accounts = await provider.request({ method: 'eth_requestAccounts' });
  } catch (err: any) {
    if (err.code === 4001) throw new Error('Connection rejected. Please approve the MetaMask request.');
    throw new Error('MetaMask request failed: ' + (err.message || ''));
  }

  if (!accounts || !accounts.length) {
    throw new Error('No accounts found. Unlock MetaMask and try again.');
  }

  // 2. Ensure Sepolia network
  const chainId: string = await provider.request({ method: 'eth_chainId' });
  if (chainId !== SEPOLIA_CHAIN_ID) {
    await switchToSepolia(provider);
  }

  return accounts[0].toLowerCase();
}

/**
 * Silently check which account MetaMask currently has active for this site.
 * Returns null if not connected / permission not granted.
 */
export async function getConnectedAccount(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;
  try {
    const accounts: string[] = await provider.request({ method: 'eth_accounts' });
    return accounts.length ? accounts[0].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Pay the platform fee (0.00025 SepoliaETH).
 * Handles getting the active account and switching network internally.
 * Returns the transaction hash.
 */
export async function payPlatformFee(): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('MetaMask not found. Please install MetaMask.');

  // Get already-authorised accounts (no popup if already connected)
  let accounts: string[] = await provider.request({ method: 'eth_accounts' });

  // If not yet authorised, prompt connection
  if (!accounts.length) {
    try {
      accounts = await provider.request({ method: 'eth_requestAccounts' });
    } catch (err: any) {
      if (err.code === 4001) throw new Error('Connection rejected. Please approve the MetaMask request.');
      throw err;
    }
  }
  if (!accounts.length) throw new Error('No wallet account available. Please connect MetaMask first.');

  // Ensure correct network
  const chainId: string = await provider.request({ method: 'eth_chainId' });
  if (chainId !== SEPOLIA_CHAIN_ID) {
    await switchToSepolia(provider);
  }

  const txHash: string = await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from: accounts[0],
      to: FEE_RECIPIENT,
      value: FEE_WEI,
      gas: '0x5208', // 21 000 — standard ETH transfer
    }],
  });
  return txHash;
}
