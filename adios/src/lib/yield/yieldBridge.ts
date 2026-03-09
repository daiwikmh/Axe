import {
  createPublicClient,
  http,
  type Chain,
  type PublicClient,
} from "viem";
import { base, arbitrum, optimism, polygon } from "viem/chains";
import { getRoutes, executeRoute, getStepTransaction } from "@lifi/sdk";
import { initLiFi } from "../shared/lifiClient";
import { YIELD_CHAINS } from "../shared/config";
import { ERC20_ABI } from "../abi/aaveV3Pool";
import type { BridgeRoute, LogEntry } from "@/types";

const CHAIN_MAP: Record<number, Chain> = {
  8453: base,
  42161: arbitrum,
  10: optimism,
  137: polygon,
};

export class YieldBridge {
  private address: `0x${string}`;
  private onLog: (log: Omit<LogEntry, "id">) => void;

  constructor(
    privateKey: string,
    address: string,
    onLog?: (log: Omit<LogEntry, "id">) => void
  ) {
    initLiFi(privateKey, 8453);
    this.address = address as `0x${string}`;
    this.onLog = onLog ?? (() => {});
  }

  private log(level: LogEntry["level"], message: string) {
    this.onLog({ timestamp: Date.now(), level, message });
  }

  private publicClient(chainId: number): PublicClient {
    const chain = CHAIN_MAP[chainId];
    if (!chain) throw new Error(`No public client for chain ${chainId}`);
    return createPublicClient({
      chain,
      transport: http(YIELD_CHAINS[chainId]?.rpcUrl),
    }) as PublicClient;
  }

  /**
   * Dry run — get routes, then simulate the actual bridge transaction
   * on-chain via eth_call. No broadcast, real state validation.
   */
  async getQuote(
    fromChainId: number,
    toChainId: number,
    amount: bigint
  ): Promise<{
    estimatedOutput: string;
    bridgeName: string;
    estimatedTime: number;
  }> {
    const from = YIELD_CHAINS[fromChainId];
    const to = YIELD_CHAINS[toChainId];
    if (!from || !to) throw new Error("Unsupported chain pair");

    this.log(
      "INFO",
      `[DRY RUN] Quoting LI.FI: ${from.name} → ${to.name} | ${(Number(amount) / 1e6).toFixed(4)} USDC`
    );

    const routesRes = await getRoutes({
      fromChainId,
      toChainId,
      fromTokenAddress: from.usdc,
      toTokenAddress: to.usdc,
      fromAmount: amount.toString(),
      fromAddress: this.address,
    });

    const route = routesRes.routes[0];
    if (!route) throw new Error("LI.FI found no routes");

    const step = route.steps[0];
    const bridgeName = step?.toolDetails?.name ?? "aggregated";

    this.log(
      "INFO",
      `[DRY RUN] Route via ${bridgeName} — simulating onchain...`
    );

    // Enrich step with actual transaction request (calldata + target contract)
    const enrichedStep = await getStepTransaction(step);
    const txReq = enrichedStep.transactionRequest;

    if (txReq?.to && txReq?.data) {
      const client = this.publicClient(fromChainId);

      // 1. Simulate ERC20 approve (bridge contract needs allowance)
      try {
        await client.simulateContract({
          address: from.usdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [txReq.to as `0x${string}`, amount],
          account: this.address,
        });
        this.log("SUCCESS", `[DRY RUN] Approval simulation passed`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.log("WARN", `[DRY RUN] Approval sim note: ${msg.slice(0, 80)}`);
      }

      // 2. Simulate the actual bridge call via eth_call
      try {
        await client.call({
          account: this.address,
          to: txReq.to as `0x${string}`,
          data: txReq.data as `0x${string}`,
          value: txReq.value ? BigInt(txReq.value.toString()) : 0n,
        });
        this.log(
          "SUCCESS",
          `[DRY RUN] Bridge tx simulation passed — est. output: ${(Number(route.toAmount) / 1e6).toFixed(4)} USDC`
        );
      } catch (e) {
        // eth_call failures on bridge contracts are common (slippage guards, liquidity checks)
        // log it but don't throw — we still have the quote
        const msg = e instanceof Error ? e.message : String(e);
        this.log(
          "WARN",
          `[DRY RUN] Bridge sim revert (expected for approval-gated calls): ${msg.slice(0, 100)}`
        );
      }
    } else {
      this.log("INFO", `[DRY RUN] No tx request in step — skipping eth_call sim`);
    }

    return {
      estimatedOutput: route.toAmount ?? "0",
      bridgeName,
      estimatedTime: step?.estimate?.executionDuration ?? 60,
    };
  }

  /**
   * Live — bridge USDC cross-chain via LI.FI.
   */
  async executeBridge(
    fromChainId: number,
    toChainId: number,
    amount: bigint
  ): Promise<BridgeRoute> {
    const from = YIELD_CHAINS[fromChainId];
    const to = YIELD_CHAINS[toChainId];
    if (!from || !to) throw new Error("Unsupported chain pair");

    this.log(
      "INFO",
      `Bridging ${(Number(amount) / 1e6).toFixed(4)} USDC: ${from.name} → ${to.name} via LI.FI`
    );

    const routesRes = await getRoutes({
      fromChainId,
      toChainId,
      fromTokenAddress: from.usdc,
      toTokenAddress: to.usdc,
      fromAmount: amount.toString(),
      fromAddress: this.address,
    });

    const route = routesRes.routes[0];
    if (!route) throw new Error("LI.FI found no routes");

    const step = route.steps[0];
    const bridgeName = step?.toolDetails?.name ?? "aggregated";
    this.log("SUCCESS", `LI.FI route via ${bridgeName}`);

    const start = Date.now();

    await executeRoute(route, {
      updateRouteHook: (updated) => {
        const s = updated.steps?.[0];
        if (s?.execution?.status) {
          this.log("INFO", `Bridge: ${s.execution.status}`);
        }
      },
    });

    const elapsed = Date.now() - start;
    this.log("SUCCESS", `Bridge complete — ${elapsed}ms`);

    return {
      fromChainId,
      toChainId,
      fromToken: from.usdc,
      toToken: to.usdc,
      fromAmount: amount.toString(),
      estimatedOutput: route.toAmount ?? "0",
      bridgeUsed: bridgeName,
      executionTime: elapsed,
    };
  }
}
