"use client";

/**
 * BNB Chain wallet context — talks to any injected EIP-1193 wallet
 * (MetaMask, Binance Web3 Wallet, Trust Wallet, OKX Wallet…) behind a small
 * React hook so components can stay declarative.
 *
 * On connect it switches (or adds) the BNB Smart Chain network configured by
 * NEXT_PUBLIC_BNB_NETWORK.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAddress, toHex } from "viem";
import { CHAIN, EXPLORER_BASE, RPC_URL } from "@/lib/bnb/config";

const STORAGE_KEY = "samono:wallet-id";

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isTrust?: boolean;
  isOkxWallet?: boolean;
  isBinance?: boolean;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
    BinanceChain?: Eip1193Provider;
  }
}

function getProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

function detectWalletType(p: Eip1193Provider): string {
  if (p.isBinance) return "binance";
  if (p.isOkxWallet) return "okx";
  if (p.isTrust) return "trust";
  if (p.isMetaMask) return "metamask";
  return "other";
}

async function ensureChain(p: Eip1193Provider) {
  const chainIdHex = toHex(CHAIN.id);
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
  } catch (err) {
    // 4902 = chain not added to the wallet yet
    if ((err as { code?: number })?.code !== 4902) throw err;
    await p.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: CHAIN.name,
          nativeCurrency: CHAIN.nativeCurrency,
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER_BASE],
        },
      ],
    });
  }
}

interface BnbWalletContextValue {
  address: string | null;
  walletType: string | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Sign an arbitrary message with personal_sign; returns the 0x signature. */
  signMessage: (message: string) => Promise<string>;
}

const BnbWalletContext = createContext<BnbWalletContextValue | null>(null);

export function BnbWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Restore a previously authorised wallet (no popup) and follow account changes.
  useEffect(() => {
    const p = getProvider();
    if (!p) return;

    if (window.localStorage.getItem(STORAGE_KEY)) {
      p.request({ method: "eth_accounts" })
        .then((accounts) => {
          const first = (accounts as string[])[0];
          if (first) {
            setAddress(getAddress(first));
            setWalletType(detectWalletType(p));
          } else {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        })
        .catch(() => window.localStorage.removeItem(STORAGE_KEY));
    }

    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts?.length) {
        window.localStorage.removeItem(STORAGE_KEY);
        setAddress(null);
        setWalletType(null);
      } else if (window.localStorage.getItem(STORAGE_KEY)) {
        setAddress(getAddress(accounts[0]));
      }
    };
    p.on?.("accountsChanged", onAccountsChanged);
    return () => p.removeListener?.("accountsChanged", onAccountsChanged);
  }, []);

  const connect = useCallback(async () => {
    const p = getProvider();
    if (!p) {
      window.open("https://metamask.io/download/", "_blank", "noopener");
      throw new Error("No EVM wallet found. Install MetaMask or Binance Web3 Wallet.");
    }
    setConnecting(true);
    try {
      const accounts = (await p.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.length) throw new Error("No account returned by wallet");
      await ensureChain(p);
      const type = detectWalletType(p);
      window.localStorage.setItem(STORAGE_KEY, type);
      setWalletType(type);
      setAddress(getAddress(accounts[0]));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const p = getProvider();
    try {
      await p?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      /* not supported by every wallet — ignore */
    }
    window.localStorage.removeItem(STORAGE_KEY);
    setAddress(null);
    setWalletType(null);
  }, []);

  const signMessage = useCallback(
    async (message: string) => {
      const p = getProvider();
      if (!p || !address) throw new Error("Wallet not connected");
      return (await p.request({
        method: "personal_sign",
        params: [toHex(message), address],
      })) as string;
    },
    [address]
  );

  return (
    <BnbWalletContext.Provider
      value={{
        address,
        walletType,
        connected: !!address,
        connecting,
        connect,
        disconnect,
        signMessage,
      }}
    >
      {children}
    </BnbWalletContext.Provider>
  );
}

export function useBnbWallet(): BnbWalletContextValue {
  const ctx = useContext(BnbWalletContext);
  if (!ctx) {
    throw new Error("useBnbWallet must be used within <BnbWalletProvider>");
  }
  return ctx;
}
