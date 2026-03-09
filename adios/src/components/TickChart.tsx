"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { RiskAssessment } from "@/types";

function generateTickHistory(currentTick: number, lower: number, upper: number) {
  const data = [];
  const range = upper - lower;
  const now = Date.now();
  for (let i = 59; i >= 0; i--) {
    const noise = (Math.random() - 0.5) * range * 0.3;
    const drift = Math.sin(i / 10) * range * 0.15;
    data.push({
      time: new Date(now - i * 60000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      tick: Math.round(currentTick + noise + drift),
      lower, upper,
    });
  }
  data[data.length - 1].tick = currentTick;
  return data;
}

export default function TickChart({ risk }: { risk: RiskAssessment | null }) {
  const currentTick = risk?.currentTick ?? 0;
  const tickLower = risk?.tickLower ?? -887220;
  const tickUpper = risk?.tickUpper ?? 887220;
  const data = generateTickHistory(currentTick, tickLower, tickUpper);

  const riskColor =
    risk?.riskLevel === "SAFE" ? "#22c55e"
    : risk?.riskLevel === "WARNING" ? "#eab308"
    : "#ef4444";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="chart-heading">Tick Position</h3>
          <p className="chart-sub">Current vs. LP range bounds</p>
        </div>
        <div className="chart-legend">
          <div className="flex items-center gap-1.5">
            <div className="chart-legend-dot" style={{ background: "var(--accent)" }} />
            <span style={{ color: "var(--text-secondary)" }}>Current Tick</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="chart-legend-dot" style={{ background: "rgba(239,68,68,0.5)" }} />
            <span style={{ color: "var(--text-secondary)" }}>Bounds</span>
          </div>
        </div>
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="tickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E1C4E9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#E1C4E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232323" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#52525b" }} axisLine={{ stroke: "#232323" }} tickLine={false} interval={9} />
            <YAxis tick={{ fontSize: 10, fill: "#52525b" }} axisLine={false} tickLine={false} domain={["dataMin - 100", "dataMax + 100"]} width={60} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181B", border: "1px solid #232323", borderRadius: "8px", fontSize: "11px" }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#E1C4E9" }}
            />
            <ReferenceLine y={tickUpper} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5}
              label={{ value: `Upper: ${tickUpper}`, position: "right", fill: "#ef4444", fontSize: 10 }}
            />
            <ReferenceLine y={tickLower} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5}
              label={{ value: `Lower: ${tickLower}`, position: "right", fill: "#ef4444", fontSize: 10 }}
            />
            <Area type="monotone" dataKey="tick" stroke="#E1C4E9" strokeWidth={2} fill="url(#tickGradient)" dot={false}
              activeDot={{ r: 4, fill: "#E1C4E9" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskColor }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Risk Level: <span style={{ color: riskColor, fontWeight: 600 }}>{risk?.riskLevel ?? "N/A"}</span>
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Current Tick: <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{currentTick}</span>
        </span>
      </div>
    </div>
  );
}
