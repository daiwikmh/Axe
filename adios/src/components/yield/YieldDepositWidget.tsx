"use client";

import { useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { YIELD_CHAINS } from "@/lib/shared/config";
import { ERC20_ABI } from "@/lib/abi/aaveV3Pool";

const CHAIN_IDS = Object.keys(YIELD_CHAINS).map(Number);

export default function YieldDepositWidget({ agentAddress }: { agentAddress: string }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [selectedChain, setSelectedChain] = useState<number>(8453);
  const [amountInput, setAmountInput] = useState("");
  const [done, setDone] = useState(false);

  const chain = YIELD_CHAINS[selectedChain];
  const amountRaw = BigInt(Math.floor(parseFloat(amountInput || "0") * 1_000_000));
  const onWrongChain = isConnected && chainId !== selectedChain;
  const agentAddr = agentAddress as `0x${string}` | undefined;

  const { data: usdcBalance } = useReadContract({
    address: chain?.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!chain },
  });

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const usdcFmt = usdcBalance ? (Number(usdcBalance as bigint) / 1e6).toFixed(4) : "—";
  const isProcessing = isPending || isConfirming || isSwitching;

  const handleSend = () => {
    if (!chain || !agentAddr || amountRaw === 0n) return;
    setDone(false);
    writeContract({
      address: chain.usdc,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [agentAddr, amountRaw],
    });
  };

  if (isConfirmed && !done) setDone(true);

  if (!isConnected) {
    return (
      <div style={{ padding: "12px 14px", background: "var(--bg-base)", borderRadius: 10, border: "1px solid var(--border)", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Connect MetaMask to fund agent</p>
      </div>
    );
  }

  if (!agentAddress) {
    return (
      <div style={{ padding: "12px 14px", background: "var(--bg-base)", borderRadius: 10, border: "1px solid var(--border)", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Start agent first to reveal wallet address</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-base)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Fund Agent
        </span>
        <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          USDC transfer
        </span>
      </div>

      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Agent address */}
        <div>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Agent Wallet</p>
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 7,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
          }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--neon-cyan-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {agentAddress.slice(0, 10)}...{agentAddress.slice(-6)}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(agentAddress)}
              style={{ fontSize: 9, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", flexShrink: 0, letterSpacing: "0.04em" }}
            >
              COPY
            </button>
          </div>
        </div>

        {/* Chain selector */}
        <div>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Chain</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {CHAIN_IDS.map((id) => (
              <button
                key={id}
                onClick={() => { setSelectedChain(id); setDone(false); }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  border: "1px solid",
                  cursor: "pointer",
                  background: selectedChain === id ? "var(--neon-cyan-ghost)" : "transparent",
                  color: selectedChain === id ? "var(--neon-cyan)" : "var(--text-muted)",
                  borderColor: selectedChain === id ? "var(--neon-cyan-muted)" : "var(--border)",
                  transition: "all 0.12s",
                }}
              >
                {YIELD_CHAINS[id].name}
              </button>
            ))}
          </div>
        </div>

        {/* Your balance */}
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Your balance: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{usdcFmt} USDC</span>
        </p>

        {/* Amount */}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => { setAmountInput(e.target.value); setDone(false); }}
            placeholder="0.0000"
            min="0"
            step="0.0001"
            style={{
              flex: 1,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              padding: "7px 10px",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            onClick={() => setAmountInput(usdcFmt !== "—" ? usdcFmt : "")}
            style={{
              padding: "7px 10px",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 600,
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-muted)",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            MAX
          </button>
        </div>

        {/* Switch chain or send */}
        {onWrongChain ? (
          <button
            onClick={() => switchChain({ chainId: selectedChain })}
            disabled={isSwitching}
            style={{
              width: "100%", padding: "8px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: "1px solid rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.08)",
              color: "#eab308", cursor: "pointer",
            }}
          >
            {isSwitching ? "Switching..." : `Switch to ${chain?.name}`}
          </button>
        ) : (
          <button
            onClick={done ? () => { setDone(false); setAmountInput(""); } : handleSend}
            disabled={isProcessing || amountRaw === 0n}
            style={{
              width: "100%", padding: "8px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: "1px solid",
              borderColor: done ? "rgba(34,197,94,0.3)" : "var(--neon-cyan-muted)",
              background: done ? "rgba(34,197,94,0.08)" : "var(--neon-cyan-ghost)",
              color: done ? "var(--success)" : "var(--neon-cyan)",
              cursor: (isProcessing || amountRaw === 0n) ? "not-allowed" : "pointer",
              opacity: (isProcessing || amountRaw === 0n) ? 0.5 : 1,
              letterSpacing: "0.02em", transition: "all 0.15s",
            }}
          >
            {isPending ? "Confirm in MetaMask..." : isConfirming ? "Confirming..." : done ? `Sent ${amountInput} USDC to agent` : "Send USDC to Agent"}
          </button>
        )}

        {error && (
          <p style={{ fontSize: 10, color: "var(--danger)", fontFamily: "var(--font-mono)" }}>
            {error.message.split("\n")[0].slice(0, 100)}
          </p>
        )}

        {txHash && (
          <p style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            tx: {txHash}
          </p>
        )}
      </div>
    </div>
  );
}
