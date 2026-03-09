"use client";

import type { RiskAssessment } from "@/types";

export default function RiskGauge({ risk }: { risk: RiskAssessment | null }) {
  const score = risk?.riskScore ?? 0;
  const level = risk?.riskLevel ?? "N/A";

  const getColor = () => {
    if (score < 30) return { main: "#22c55e", glow: "rgba(34,197,94,0.3)" };
    if (score < 60) return { main: "#eab308", glow: "rgba(234,179,8,0.3)" };
    if (score < 85) return { main: "#f97316", glow: "rgba(249,115,22,0.3)" };
    return { main: "#ef4444", glow: "rgba(239,68,68,0.3)" };
  };

  const colors = getColor();
  const rotation = -90 + (score / 100) * 180;

  return (
    <div className="gauge-card">
      <h3 className="gauge-title mb-4">Risk Score</h3>

      <div className="relative w-40 h-20 overflow-hidden">
        <div className="absolute inset-0">
          <svg viewBox="0 0 160 80" className="w-full h-full">
            <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" className="gauge-arc-bg" strokeWidth="8" strokeLinecap="round" />
            <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={colors.main} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 220} 220`}
              style={{ filter: `drop-shadow(0 0 6px ${colors.glow})`, transition: "stroke-dasharray 0.8s ease-out" }}
            />
          </svg>
        </div>

        <div className="absolute bottom-0 left-1/2 origin-bottom"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, transition: "transform 0.8s ease-out" }}
        >
          <div className="w-0.5 h-14 rounded-full" style={{ background: `linear-gradient(to top, ${colors.main}, transparent)` }} />
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full"
          style={{ backgroundColor: colors.main, boxShadow: `0 0 10px ${colors.glow}` }}
        />
      </div>

      <div className="mt-4 text-center">
        <p className="gauge-value" style={{ color: colors.main }}>{score.toFixed(1)}%</p>
        <p className="gauge-level mt-1">
          Level: <span style={{ color: colors.main, fontWeight: 600 }}>{level}</span>
        </p>
      </div>
    </div>
  );
}
