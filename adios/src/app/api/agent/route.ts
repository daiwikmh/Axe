import { NextResponse } from "next/server";
import {
  getAgentState,
  startAgent,
  stopAgent,
  simulateRisk,
  resetAgent,
} from "@/lib/agent";
import {
  DEFAULT_POOL_ADDRESS,
  DEFAULT_RISK_THRESHOLD,
  DEFAULT_POLL_INTERVAL,
} from "@/lib/config";
import type { RiskAssessment } from "@/types";

export async function GET() {
  return NextResponse.json(getAgentState());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "start": {
        startAgent({
          rpcUrl: process.env.RPC_URL || "https://mainnet.base.org",
          poolAddress: body.poolAddress || DEFAULT_POOL_ADDRESS,
          positionTokenId:
            body.positionTokenId || process.env.POSITION_NFT_ID || "0",
          tickLower:
            body.tickLower ??
            Number(process.env.TICK_LOWER ?? -887220),
          tickUpper:
            body.tickUpper ??
            Number(process.env.TICK_UPPER ?? 887220),
          riskThreshold:
            body.riskThreshold ??
            Number(process.env.RISK_THRESHOLD ?? DEFAULT_RISK_THRESHOLD),
          pollIntervalMs:
            body.pollIntervalMs ??
            Number(process.env.POLL_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL),
          fromChainId: body.fromChainId ?? 8453, // Base by default
          privateKey: process.env.PRIVATE_KEY,
          privateRpcUrl: process.env.PRIVATE_RPC_URL,
          targetChainId:
            body.targetChainId ??
            Number(process.env.TARGET_CHAIN_ID ?? 1),
          targetToken: body.targetToken || process.env.TARGET_TOKEN,
        });
        return NextResponse.json({ ok: true, status: "started" });
      }

      case "stop":
        stopAgent();
        return NextResponse.json({ ok: true, status: "stopped" });

      case "reset":
        resetAgent();
        return NextResponse.json({ ok: true, status: "reset" });

      case "simulate":
        simulateRisk(body.level as RiskAssessment["riskLevel"]);
        return NextResponse.json({
          ok: true,
          status: "simulated",
          level: body.level,
        });

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
