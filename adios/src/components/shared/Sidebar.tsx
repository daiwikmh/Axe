"use client";

import Image from "next/image";
import WalletButton from "./WalletButton";

const AaveLogo = () => (
  <svg width="22" height="12" viewBox="0 0 266 139" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M97.5418 138.533C112.461 138.533 124.556 126.438 124.556 111.518C124.556 96.5987 112.461 84.5039 97.5418 84.5039C82.6221 84.5039 70.5273 96.5987 70.5273 111.518C70.5273 126.438 82.6221 138.533 97.5418 138.533Z" fill="currentColor"/>
    <path d="M168.149 138.533C183.069 138.533 195.164 126.438 195.164 111.518C195.164 96.5987 183.069 84.5039 168.149 84.5039C153.23 84.5039 141.135 96.5987 141.135 111.518C141.135 126.438 153.23 138.533 168.149 138.533Z" fill="currentColor"/>
    <path d="M132.8 0C59.4497 0 -0.0191954 60.6017 4.64786e-06 135.335H33.9264C33.9264 79.3281 77.8433 33.92 132.8 33.92C187.757 33.92 231.674 79.3281 231.674 135.335H265.6C265.613 60.6017 206.144 0 132.8 0Z" fill="currentColor"/>
  </svg>
);


export default function Sidebar({
  mode,
  onModeChange,
  simulationMode,
  onSimulationModeChange,
}: {
  mode: "guardian" | "yield";
  onModeChange: (mode: "guardian" | "yield") => void;
  simulationMode: "DRY_RUN" | "LIVE";
  onSimulationModeChange: (mode: "DRY_RUN" | "LIVE") => void;
}) {
  const isYield = mode === "yield";
  const isLive = simulationMode === "LIVE";

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="flex items-center gap-3">
          <div
            className="sidebar-logo"
            style={isYield ? { background: "var(--neon-cyan-ghost)", borderColor: "var(--neon-cyan-muted)" } : {}}
          >
            <span style={isYield ? { color: "var(--neon-cyan)" } : {}}>a</span>
          </div>
          <div>
            <h1 className="sidebar-title">brahma</h1>
            <p className="sidebar-subtitle" style={isYield ? { color: "var(--neon-cyan-dim)" } : {}}>
              autonomous yield
            </p>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ display: "flex", background: "var(--bg-base)", borderRadius: 10, padding: 3, gap: 2 }}>
          <button
            onClick={() => onModeChange("yield")}
            style={{
              flex: 1,
              padding: "7px 8px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              background: mode === "yield" ? "var(--neon-cyan-ghost)" : "transparent",
              color: mode === "yield" ? "var(--neon-cyan)" : "var(--text-muted)",
              borderColor: mode === "yield" ? "var(--neon-cyan-muted)" : "transparent",
              boxShadow: mode === "yield" ? "0 0 12px rgba(0,255,224,0.08)" : "none",
              letterSpacing: "0.02em",
              transition: "all 0.15s",
            }}
          >
            Yielder
          </button>
          <button
            onClick={() => onModeChange("guardian")}
            style={{
              flex: 1,
              padding: "7px 8px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              background: mode === "guardian" ? "var(--accent-ghost)" : "transparent",
              color: mode === "guardian" ? "var(--accent)" : "var(--text-muted)",
              borderColor: mode === "guardian" ? "var(--accent-muted)" : "transparent",
              letterSpacing: "0.02em",
              transition: "all 0.15s",
            }}
          >
            Guardian
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Execution mode toggle */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Execution Mode
        </p>
        <button
          onClick={() => onSimulationModeChange(isLive ? "DRY_RUN" : "LIVE")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid",
            borderColor: isLive ? "var(--neon-cyan-muted)" : "rgba(255,45,120,0.18)",
            background: isLive ? "var(--neon-cyan-ghost)" : "var(--neon-pink-ghost)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: isLive ? "var(--neon-cyan)" : "var(--neon-pink)",
          }}>
            {isLive ? "LIVE" : "SIMULATION"}
          </span>
          {/* Toggle pill */}
          <div style={{
            width: 34,
            height: 18,
            borderRadius: 99,
            background: isLive ? "var(--neon-cyan)" : "rgba(255,45,120,0.3)",
            position: "relative",
            transition: "background 0.2s",
          }}>
            <div style={{
              position: "absolute",
              top: 2,
              left: isLive ? 18 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: isLive ? "#000" : "var(--neon-pink)",
              transition: "left 0.2s",
            }} />
          </div>
        </button>
      </div>

      {/* Wallet */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <WalletButton />
      </div>

      {/* Powered By */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Powered by
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <AaveLogo />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>Aave</span>
          </div>
          <div style={{ width: 1, height: 16, background: "var(--border)" }} />
          <Image src="/logo_lifi_dark.png" alt="LI.FI" width={36} height={14} style={{ objectFit: "contain", opacity: 0.7 }} />
        </div>
      </div>

      {/* Bottom info */}
      <div
        className="mev-shield"
        style={isYield ? { background: "var(--neon-cyan-ghost)", borderColor: "rgba(0,255,224,0.08)" } : {}}
      >
        {isYield ? (
          <>
            <p className="mev-shield-title" style={{ color: "var(--neon-cyan-dim)" }}>Cross-Chain Yield</p>
            <p className="mev-shield-text">Aave V3 USDC on Base, Arbitrum, Optimism, Polygon via LI.FI.</p>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="mev-dot" style={{ background: "var(--neon-cyan)" }} />
              <span className="text-[10px]" style={{ color: "var(--neon-cyan)" }}>DeFiLlama Live</span>
            </div>
          </>
        ) : (
          <>
            <p className="mev-shield-title">MEV Shield</p>
            <p className="mev-shield-text">Flashbots Protect RPC active. Shielded from frontrunning.</p>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="mev-dot" />
              <span className="text-[10px]" style={{ color: "var(--success)" }}>Protected</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
