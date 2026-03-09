"use client";

import { ArrowRight, CheckCircle, XCircle } from "lucide-react";
import type { EvacuationResult } from "@/types";
import { SUPPORTED_CHAINS } from "@/lib/config";

export default function EvacuationPanel({ evacuations }: { evacuations: EvacuationResult[] }) {
  return (
    <div className="card p-5">
      <h3 className="evac-heading">Evacuation History</h3>

      {evacuations.length === 0 ? (
        <div className="evac-empty">No evacuations triggered yet. Position is within safe range.</div>
      ) : (
        <div className="space-y-2">
          {evacuations.map((evac, i) => {
            const fromChain = SUPPORTED_CHAINS[evac.bridgeRoute?.fromChainId ?? 1];
            const toChain = SUPPORTED_CHAINS[evac.bridgeRoute?.toChainId ?? 8453];
            return (
              <div key={i} className="evac-row">
                <div className="flex items-center gap-3">
                  {evac.success
                    ? <CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />
                    : <XCircle className="w-4 h-4" style={{ color: "var(--danger)" }} />
                  }
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="evac-chain">{fromChain?.name ?? "Source"}</span>
                      <ArrowRight className="w-3 h-3 evac-arrow" />
                      <span className="evac-chain">{toChain?.name ?? "Target"}</span>
                    </div>
                    <p className="evac-meta">
                      Bridge: {evac.bridgeRoute?.bridgeUsed ?? "N/A"} |{" "}
                      {evac.bridgeRoute?.executionTime ? `${(evac.bridgeRoute.executionTime / 1000).toFixed(1)}s` : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="evac-time">{new Date(evac.timestamp).toLocaleTimeString()}</p>
                  {evac.txHash && <p className="evac-hash">{evac.txHash.slice(0, 10)}...</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
