"use client";

import { Bot, Lock, Wifi, WifiOff } from "lucide-react";
import type { AgentState } from "@/types";

export default function AgentPanel({ state }: { state: AgentState }) {
  const isLive =
    state.status === "MONITORING" ||
    state.status === "EVACUATING" ||
    state.status === "BRIDGING";

  const riskScore = state.lastRisk?.riskScore ?? 0;
  const riskColor =
    riskScore < 30 ? "var(--success)" : riskScore < 60 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="agent-panel">
      {/* Header */}
      <div className="agent-header">
        <div className="agent-icon"><Bot /></div>
        <div className="flex-1 min-w-0">
          <p className="agent-name">Agent</p>
          <p className="agent-role">Autonomous Monitor</p>
        </div>
        <div className="agent-status">
          {isLive
            ? <Wifi className="w-3 h-3" style={{ color: "var(--success)" }} />
            : <WifiOff className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
          }
          <span style={{ color: isLive ? "var(--success)" : "var(--text-muted)" }}>
            {isLive ? "Live" : "Off"}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="metric-card">
          <p className="metric-label">Checks</p>
          <p className="metric-value">{state.checksPerformed}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Evacuations</p>
          <p className="metric-value">{state.evacuationHistory.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Risk</p>
          <p className="metric-value" style={{ color: state.lastRisk ? riskColor : undefined }}>
            {state.lastRisk ? `${riskScore.toFixed(1)}%` : "--"}
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Last Check</p>
          <p className="metric-value">
            {state.lastCheck
              ? new Date(state.lastCheck).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : "--"}
          </p>
        </div>
      </div>

      {/* Connections */}
      <div className="space-y-1.5">
        <p className="conn-label uppercase tracking-wider">Connections</p>
        <ConnRow label="RPC" value={isLive ? "Connected" : "Idle"} ok={isLive} />
        <ConnRow label="Flashbots" value="Shielded" ok icon />
        <ConnRow label="LI.FI" value="v3.x" ok />
      </div>

      {/* Shield */}
      <div className="shield-box">
        <div className="shield-title"><Lock /> MEV Shield Active</div>
        <p className="shield-text">Txs routed via Flashbots Protect. Hidden from public mempool.</p>
      </div>
    </div>
  );
}

function ConnRow({ label, value, ok, icon }: { label: string; value: string; ok?: boolean; icon?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="conn-label">{label}</span>
      <div className="flex items-center gap-1.5">
        {icon && <Lock className="w-2.5 h-2.5" style={{ color: "var(--accent)" }} />}
        <span className={`conn-value ${ok ? "ok" : "off"}`}>{value}</span>
      </div>
    </div>
  );
}
