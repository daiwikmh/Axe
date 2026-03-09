"use client";

import {
  Activity,
  BarChart3,
  Shield,
  Settings,
  Zap,
  Radio,
  type LucideIcon,
} from "lucide-react";
import WalletButton from "./WalletButton";

const NAV_ITEMS: { icon: LucideIcon; label: string; id: string }[] = [
  { icon: Activity, label: "Dashboard", id: "dashboard" },
  { icon: Radio, label: "Monitor", id: "monitor" },
  { icon: Shield, label: "Positions", id: "positions" },
  { icon: Zap, label: "Evacuations", id: "evacuations" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export default function Sidebar({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo"><span>a</span></div>
          <div>
            <h1 className="sidebar-title">adios</h1>
            <p className="sidebar-subtitle">LP Guardian</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`nav-item ${active === item.id ? "active" : ""}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ borderTop: "1px solid var(--border)" }}>
        <WalletButton />
      </div>

      <div className="mev-shield">
        <p className="mev-shield-title">MEV Shield</p>
        <p className="mev-shield-text">
          Flashbots Protect RPC active. Shielded from frontrunning.
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="mev-dot" />
          <span className="text-[10px]" style={{ color: "var(--success)" }}>Protected</span>
        </div>
      </div>
    </aside>
  );
}
