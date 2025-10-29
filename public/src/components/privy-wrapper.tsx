"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

interface PrivyWrapperProps {
  children: ReactNode;
}

export default function PrivyWrapper({ children }: PrivyWrapperProps) {
  return (
    <PrivyProvider
      appId="cmgw44x9d01kml70c9yzpfvhd"
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#0044ff",
          logo: "https://decharge.network/favicon.png",
          showWalletLoginFirst: false, // Show email/SMS first
          walletChainType: "solana-only",
          walletList: [
            "solflare",
            "phantom", 
            "binance",
            "backpack",
            "detected_solana_wallets",
            "coinbase_wallet",
            "metamask",
            "rainbow",
            "wallet_connect",
            "cryptocom",
            "okx_wallet",
          ],
        },
        loginMethods: ["email", "sms", "wallet"], // Email first, SMS second, wallet third
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        supportedChains: [
          {
            id: 101,
            name: "Solana Mainnet",
            network: "solana-mainnet",
            nativeCurrency: {
              name: "SOL",
              symbol: "SOL", 
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: ["https://api.mainnet-beta.solana.com"],
              },
              public: {
                http: ["https://api.mainnet-beta.solana.com"],
              },
            },
          },
          {
            id: 102,
            name: "Solana Devnet",
            network: "solana-devnet",
            nativeCurrency: {
              name: "SOL",
              symbol: "SOL",
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: ["https://api.devnet.solana.com"],
              },
              public: {
                http: ["https://api.devnet.solana.com"],
              },
            },
          },
        ],
        defaultChain: {
          id: 102,
          name: "Solana Devnet",
          network: "solana-devnet",
          nativeCurrency: {
            name: "SOL",
            symbol: "SOL",
            decimals: 9,
          },
          rpcUrls: {
            default: {
              http: ["https://api.devnet.solana.com"],
            },
            public: {
              http: ["https://api.devnet.solana.com"],
            },
          },
        },
        mfa: {
          noPromptOnMfaRequired: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}