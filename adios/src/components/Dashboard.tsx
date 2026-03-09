"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import Sidebar from "./Sidebar";
import AgentPanel from "./AgentPanel";
import StatsCards from "./StatsCards";
import TickChart from "./TickChart";
import RiskGauge from "./RiskGauge";
import ActivityLog from "./ActivityLog";
import ControlPanel from "./ControlPanel";
import EvacuationPanel from "./EvacuationPanel";
import type { AgentState } from "@/types";

const INITIAL_STATE: AgentState = {
  status: "IDLE",
  lastCheck: 0,
  lastRisk: null,
  evacuationHistory: [],
  logs: [],
  uptime: 0,
  checksPerformed: 0,
};

export default function Dashboard() {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/agent");
        if (res.ok) setState(await res.json());
      } catch { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = useCallback(
    async (action: string, data?: Record<string, unknown>) => {
      try {
        await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...data }),
        });
      } catch (err) {
        console.error("Action failed:", err);
      }
    },
    []
  );

  const statusClass =
    state.status === "MONITORING"
      ? "live"
      : state.status === "EVACUATING" || state.status === "BRIDGING"
        ? "alert"
        : "idle";

  return (
    <div className="flex h-screen overflow-y-auto overflow-x-hidden" style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>
      {leftOpen && <Sidebar active={activeNav} onNavigate={setActiveNav} />}

      <main
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: leftOpen ? 220 : 0 }}
      >
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button onClick={() => setLeftOpen(!leftOpen)} className="icon-btn">
              {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div>
              <h2 className="topbar-title">Dashboard</h2>
              <p className="topbar-sub">adios — Autonomous LP Guardian</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="status-badge">
              <div className={`status-dot ${statusClass}`} />
              <span>{state.status}</span>
            </div>
            <button onClick={() => setRightOpen(!rightOpen)} className="icon-btn">
              {rightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="p-6 space-y-4">
          <StatsCards state={state} />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><TickChart risk={state.lastRisk} /></div>
            <RiskGauge risk={state.lastRisk} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ControlPanel state={state} onAction={handleAction} />
            <div className="col-span-2"><ActivityLog logs={state.logs} /></div>
          </div>
          <EvacuationPanel evacuations={state.evacuationHistory} />
        </div>
      </main>

      {rightOpen && (
        <aside className="w-[320px] shrink-0 card m-3 ml-0 self-start sticky top-3">
          <AgentPanel state={state} />
        </aside>
      )}
    </div>
  );
}
