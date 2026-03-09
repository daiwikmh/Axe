"use client";

import { Play, Square, RotateCcw, AlertTriangle, Zap, Shield } from "lucide-react";
import type { AgentState } from "@/types";

export default function ControlPanel({
  state,
  onAction,
}: {
  state: AgentState;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}) {
  const isRunning =
    state.status === "MONITORING" ||
    state.status === "EVACUATING" ||
    state.status === "BRIDGING";

  return (
    <div className="card p-5">
      <h3 className="control-heading">Agent Control</h3>

      <div className="grid grid-cols-2 gap-2">
        {!isRunning ? (
          <button onClick={() => onAction("start")} className="btn btn-start col-span-2">
            <Play className="w-3.5 h-3.5" /> Start Monitoring
          </button>
        ) : (
          <button onClick={() => onAction("stop")} className="btn btn-stop col-span-2">
            <Square className="w-3.5 h-3.5" /> Stop Agent
          </button>
        )}

        <button onClick={() => onAction("reset")} className="btn btn-ghost">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <button onClick={() => onAction("simulate", { level: "SAFE" })} className="btn btn-sim-safe">
          <Shield className="w-3 h-3" /> Sim: Safe
        </button>
        <button onClick={() => onAction("simulate", { level: "WARNING" })} className="btn btn-sim-warn">
          <AlertTriangle className="w-3 h-3" /> Sim: Warning
        </button>
        <button onClick={() => onAction("simulate", { level: "CRITICAL" })} className="btn btn-sim-crit">
          <Zap className="w-3 h-3" /> Sim: Critical
        </button>
      </div>

      <div className="powered-by">
        <p className="powered-by-label">Powered by</p>
        <div className="flex items-center gap-2">
          <div className="lifi-badge">Li</div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>LI.FI Protocol</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)" }}>Cross-chain bridge aggregation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
