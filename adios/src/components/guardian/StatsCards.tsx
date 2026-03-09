"use client";

import { Clock, Eye, Zap, TrendingUp, Layers, Wallet } from "lucide-react";
import type { AgentState } from "@/types";
import { usePositions } from "@/hooks/usePosition";
import { useAccount } from "wagmi";

export default function StatsCards({ state }: { state: AgentState }) {
  const uptime = state.uptime ? Math.floor((Date.now() - state.uptime) / 1000) : 0;
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = uptime % 60;
  const uptimeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  const { isConnected } = useAccount();
  const { positions, positionCount, isLoading } = usePositions();

  const statusColor =
    state.status === "MONITORING" ? "val-success"
    : state.status === "EVACUATING" || state.status === "BRIDGING" ? "val-danger"
    : "val-muted";

  const statusGlow =
    state.status === "MONITORING" ? "glow-success"
    : state.status === "EVACUATING" ? "glow-danger"
    : "";

  const stats = [
    { icon: Eye, label: "Status", value: state.status, color: statusColor, glow: statusGlow },
    {
      icon: Wallet, label: "Wallet",
      value: isConnected ? (isLoading ? "Loading..." : `${positionCount} position${positionCount !== 1 ? "s" : ""}`) : "Not Connected",
      color: isConnected ? "val-accent" : "val-muted", glow: "",
    },
    {
      icon: Layers, label: "Top Position",
      value: isConnected && positions.length > 0 ? `${positions[0].token0Symbol}/${positions[0].token1Symbol}` : "--",
      sub: isConnected && positions.length > 0 ? `${(positions[0].fee / 10000).toFixed(2)}% fee` : undefined,
      color: positions.length > 0 ? "val-accent" : "val-muted", glow: "",
    },
    { icon: Clock, label: "Uptime", value: uptimeStr, color: "val-accent", glow: "" },
    { icon: TrendingUp, label: "Checks", value: state.checksPerformed.toString(), color: "val-accent", glow: "" },
    {
      icon: Zap, label: "Evacuations",
      value: state.evacuationHistory.length.toString(),
      color: state.evacuationHistory.length > 0 ? "val-warning" : "val-muted", glow: "",
    },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat-card ${stat.glow}`}>
          <div className="stat-label">
            <stat.icon />
            <span>{stat.label}</span>
          </div>
          <p className={`stat-value truncate ${stat.color}`}>{stat.value}</p>
          {"sub" in stat && stat.sub && <p className="stat-sub">{stat.sub}</p>}
        </div>
      ))}
    </div>
  );
}
