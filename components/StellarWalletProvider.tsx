"use client";

/**
 * Stellar wallet context — wraps Stellar Wallets Kit (Freighter / Albedo /
 * xBull / Lobstr) behind a small React hook so components can stay declarative.
 *
 * Replaces the old @solana/wallet-adapter provider tree. The Kit is imperative
 * and browser-only, so it is instantiated lazily on the client.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  FreighterModule,
  AlbedoModule,
  xBullModule,
  LobstrModule,
  type ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";

const STORAGE_KEY = "samono:wallet-id";

const NETWORK: WalletNetwork = (() => {
  switch (process.env.NEXT_PUBLIC_STELLAR_NETWORK) {
    case "public":
      return WalletNetwork.PUBLIC;
    case "futurenet":
      return WalletNetwork.FUTURENET;
    default:
      return WalletNetwork.TESTNET;
  }
})();

let _kit: StellarWalletsKit | null = null;
function getKit(): StellarWalletsKit {
  if (!_kit) {
    _kit = new StellarWalletsKit({
      network: NETWORK,
      modules: [
        new FreighterModule(),
        new AlbedoModule(),
        new xBullModule(),
        new LobstrModule(),
      ],
    });
  }
  return _kit;
}

interface StellarWalletContextValue {
  address: string | null;
  walletType: string | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Sign an arbitrary message; returns the wallet-encoded signature string. */
  signMessage: (message: string) => Promise<string>;
}

const StellarWalletContext = createContext<StellarWalletContextValue | null>(null);

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Attempt to restore a previously selected wallet on mount.
  useEffect(() => {
    const storedId = window.localStorage.getItem(STORAGE_KEY);
    if (!storedId) return;
    const kit = getKit();
    kit.setWallet(storedId);
    setWalletType(storedId);
    kit
      .getAddress()
      .then(({ address }) => setAddress(address))
      .catch(() => {
        // Wallet no longer available / not authorised — clear it.
        window.localStorage.removeItem(STORAGE_KEY);
        setWalletType(null);
      });
  }, []);

  const connect = useCallback(async () => {
    const kit = getKit();
    setConnecting(true);
    try {
      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          kit.setWallet(option.id);
          const { address } = await kit.getAddress();
          window.localStorage.setItem(STORAGE_KEY, option.id);
          setWalletType(option.id);
          setAddress(address);
        },
      });
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const kit = getKit();
    try {
      await kit.disconnect();
    } catch {
      /* ignore */
    }
    window.localStorage.removeItem(STORAGE_KEY);
    setAddress(null);
    setWalletType(null);
  }, []);

  const signMessage = useCallback(
    async (message: string) => {
      const kit = getKit();
      const { signedMessage } = await kit.signMessage(message, {
        address: address ?? undefined,
      });
      return signedMessage;
    },
    [address]
  );

  return (
    <StellarWalletContext.Provider
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
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet(): StellarWalletContextValue {
  const ctx = useContext(StellarWalletContext);
  if (!ctx) {
    throw new Error("useStellarWallet must be used within <StellarWalletProvider>");
  }
  return ctx;
}
