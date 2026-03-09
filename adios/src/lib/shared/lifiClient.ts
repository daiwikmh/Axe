import { createWalletClient, http, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, base, arbitrum, optimism, polygon } from "viem/chains";
import { createConfig, EVM } from "@lifi/sdk";
import { YIELD_CHAINS } from "./config";

const CHAIN_MAP: Record<number, Chain> = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
  10: optimism,
  137: polygon,
};

let initialized = false;

export function initLiFi(privateKey: string, defaultChainId: number) {
  if (initialized) return;

  const account = privateKeyToAccount(
    (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`
  );

  const chain = CHAIN_MAP[defaultChainId] ?? base;
  // Use Alchemy txRpcUrl for the default chain, fall back to public
  const defaultTxRpc = YIELD_CHAINS[defaultChainId]?.txRpcUrl;

  createConfig({
    integrator: process.env.LIFI_INTEGRATOR || "adios",
    providers: [
      EVM({
        getWalletClient: async () =>
          createWalletClient({
            account,
            chain,
            transport: http(defaultTxRpc), // Alchemy for tx submission
          }),
        switchChain: async (targetChainId: number) => {
          const targetChain = CHAIN_MAP[targetChainId];
          if (!targetChain) throw new Error(`Unsupported chain: ${targetChainId}`);
          // Use Alchemy txRpcUrl for target chain if available
          const txRpc = YIELD_CHAINS[targetChainId]?.txRpcUrl;
          return createWalletClient({
            account,
            chain: targetChain,
            transport: http(txRpc),
          });
        },
      }),
    ],
  });

  initialized = true;
}
