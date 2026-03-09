"use client";

import { useState, useEffect } from "react";
import type { YieldAgentState } from "@/types";
import { YIELD_CHAINS } from "@/lib/shared/config";
import YieldDepositWidget from "./YieldDepositWidget";

export default function YieldAgentPanel({
  state,
  onAction,
}: {
  state: YieldAgentState;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}) {
  const isLive = !["IDLE", "PAUSED", "ERROR"].includes(state.status);
  const totalUsd = Number(state.totalBalance ?? "0") / 1e6;
  const allocated = Number(state.allocatedAmount ?? "0") / 1e6;

  const [allocationInput, setAllocationInput] = useState("");
  const [fetching, setFetching] = useState(false);

  // Sync input with current allocation when it changes externally
  useEffect(() => {
    if (allocated > 0) setAllocationInput(allocated.toFixed(6).replace(/\.?0+$/, ""));
  }, [allocated]);

  const handleFetchBalances = async () => {
    setFetching(true);
    await onAction("fetch-balances");
    setTimeout(() => setFetching(false), 1500);
  };

  const handleSetAllocation = () => {
    const val = parseFloat(allocationInput);
    if (!isNaN(val) && val >= 0) {
      onAction("set-allocation", { amount: allocationInput });
    }
  };

  return (
    <div className="agent-panel">
      {/* Header */}
      <div className="agent-header">
        <div className="agent-icon" style={{ background: "var(--neon-cyan-ghost)" }}>
          <span style={{ color: "var(--neon-cyan)", fontSize: 14, fontWeight: 700 }}>Y</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="agent-name">Yield Agent</p>
          <p className="agent-role">Yield Hunter</p>
        </div>
        <div className="agent-status">
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isLive ? "var(--neon-cyan)" : "var(--text-muted)",
            boxShadow: isLive ? "0 0 6px var(--neon-cyan)" : "none",
          }} />
          <span style={{ color: isLive ? "var(--neon-cyan)" : "var(--text-muted)" }}>
            {isLive ? "Live" : "Off"}
          </span>
        </div>
      </div>

      {/* Hanko stamp */}
      <div className="flex justify-center">
        <div className="hanko">YIELD</div>
      </div>

      {/* Unified balance */}
      <div style={{
        background: "var(--bg-base)",
        borderRadius: 10,
        padding: "12px 14px",
        border: "1px solid var(--border)",
      }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Unified Balance
          </span>
          <button
            onClick={handleFetchBalances}
            style={{
              fontSize: 9,
              color: fetching ? "var(--neon-cyan)" : "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {fetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: totalUsd > 0 ? "var(--neon-cyan)" : "var(--text-muted)",
          letterSpacing: "-0.02em",
        }}>
          ${totalUsd.toFixed(4)}
          <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginLeft: 4 }}>USDC</span>
        </p>

        {/* Per-chain breakdown */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          {Object.entries(YIELD_CHAINS).map(([id, chain]) => {
            const b = state.walletBalances?.[Number(id)];
            const usdcAmt = Number(b?.usdc ?? "0") / 1e6;
            const aTokenAmt = Number(b?.aToken ?? "0") / 1e6;
            const chainTotal = usdcAmt + aTokenAmt;
            if (b === undefined) return null;
            return (
              <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{chain.name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {aTokenAmt > 0 && (
                    <span style={{ fontSize: 10, color: "var(--neon-cyan-dim)", fontFamily: "var(--font-mono)" }}>
                      {aTokenAmt.toFixed(4)} aUSDC
                    </span>
                  )}
                  <span style={{
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: chainTotal > 0 ? "var(--text-primary)" : "var(--text-muted)",
                  }}>
                    ${chainTotal.toFixed(4)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Allocation */}
      <div style={{
        background: "var(--bg-base)",
        borderRadius: 10,
        padding: "12px 14px",
        border: "1px solid var(--border)",
      }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Allocation
          </span>
          {allocated > 0 && (
            <span style={{ fontSize: 10, color: "var(--neon-cyan)", fontFamily: "var(--font-mono)" }}>
              ${allocated.toFixed(4)} active
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="number"
            value={allocationInput}
            onChange={(e) => setAllocationInput(e.target.value)}
            placeholder={totalUsd > 0 ? totalUsd.toFixed(4) : "0.0000"}
            min="0"
            step="0.0001"
            style={{
              flex: 1,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              padding: "6px 10px",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            onClick={handleSetAllocation}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 600,
              border: "1px solid var(--neon-cyan-muted)",
              background: "var(--neon-cyan-ghost)",
              color: "var(--neon-cyan)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
            }}
          >
            Set
          </button>
        </div>
        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 5 }}>
          {allocated > 0
            ? `Agent manages ${((allocated / Math.max(totalUsd, 0.0001)) * 100).toFixed(0)}% of total balance`
            : "Leave empty to use full available balance"}
        </p>
      </div>

      {/* Fund agent from MetaMask */}
      <YieldDepositWidget agentAddress={state.agentAddress} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="metric-card">
          <p className="metric-label">Scans</p>
          <p className="metric-value">{state.scansPerformed}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Moves</p>
          <p className="metric-value">{state.movesPerformed}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Best APY</p>
          <p className="metric-value" style={{ color: state.bestYield ? "var(--neon-cyan)" : undefined }}>
            {state.bestYield ? `${state.bestYield.apyTotal.toFixed(2)}%` : "--"}
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Mode</p>
          <p className="metric-value" style={{ color: state.mode === "LIVE" ? "var(--neon-cyan)" : "var(--neon-pink)", fontSize: 11 }}>
            {state.mode === "LIVE" ? "LIVE" : "SIM"}
          </p>
        </div>
      </div>

      {/* Connections */}
      <div className="space-y-1.5">
        <p className="conn-label uppercase tracking-wider">Connections</p>
        <ConnRow label="DeFiLlama" value="API" ok />
        <ConnRow label="LI.FI" value="v3.x" ok />
        <ConnRow label="Aave V3" value={isLive ? "Connected" : "Idle"} ok={isLive} />
      </div>

      {/* Current position */}
      {state.currentPosition && (
        <div className="shield-box" style={{ background: "var(--neon-cyan-ghost)", borderColor: "rgba(0,255,224,0.08)" }}>
          <div className="shield-title" style={{ color: "var(--neon-cyan)" }}>Active Position</div>
          <p className="shield-text">
            {state.currentPosition.chainName} — {state.currentPosition.currentApy.toFixed(2)}% APY
            <br />
            ${(Number(state.currentPosition.depositedAmount) / 1e6).toFixed(4)} USDC
          </p>
        </div>
      )}
    </div>
  );
}

function ConnRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="conn-label">{label}</span>
      <span className={`conn-value ${ok ? "ok" : "off"}`}>{value}</span>
    </div>
  );
}
