"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check } from "lucide-react";

export default function WalletButton() {
  const { address, chain, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = chain?.blockExplorers?.default?.url;

  if (!isConnected) {
    return (
      <div className="p-3">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="wallet-connect"
          >
            <Wallet className="w-4 h-4" />
            {isPending ? "Connecting..." : `Connect ${connector.name}`}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="p-3 relative">
      <button onClick={() => setOpen(!open)} className="wallet-trigger">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="wallet-avatar"><Wallet /></div>
          <div className="text-left min-w-0">
            <p className="wallet-addr truncate">{truncate(address!)}</p>
            <p className="wallet-chain">{chain?.name ?? "Unknown"}</p>
          </div>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="wallet-dropdown">
          <div className="wallet-balance">
            <p className="wallet-balance-label">Balance</p>
            <p className="wallet-balance-value">
              {balance
                ? `${(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} ${balance.symbol}`
                : "..."}
            </p>
          </div>
          <div className="p-1.5">
            <button onClick={copyAddress} className="wallet-action">
              {copied ? <Check className="w-3.5 h-3.5" style={{ color: "var(--success)" }} /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Address"}
            </button>
            {explorerUrl && (
              <a href={`${explorerUrl}/address/${address}`} target="_blank" rel="noopener noreferrer" className="wallet-action">
                <ExternalLink className="w-3.5 h-3.5" />
                View on Explorer
              </a>
            )}
            <button onClick={() => { disconnect(); setOpen(false); }} className="wallet-action danger">
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
