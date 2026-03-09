"use client";

import { Terminal } from "lucide-react";
import type { LogEntry } from "@/types";

const BADGE_CLASS: Record<LogEntry["level"], { cls: string; label: string }> = {
  INFO:    { cls: "info",  label: "INF" },
  WARN:    { cls: "warn",  label: "WRN" },
  ERROR:   { cls: "error", label: "ERR" },
  SUCCESS: { cls: "ok",    label: "OK " },
};

export default function ActivityLog({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="log-card">
      <div className="log-header">
        <div className="log-header-left">
          <Terminal />
          <h3>Agent Log</h3>
        </div>
        <span className="log-count">{logs.length} entries</span>
      </div>

      <div className="log-body">
        {logs.length === 0 ? (
          <div className="log-empty">Agent idle. Start monitoring to see logs.</div>
        ) : (
          logs.map((log) => {
            const badge = BADGE_CLASS[log.level];
            const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
              hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
            });
            return (
              <div key={log.id} className="log-entry">
                <span className="log-time">{time}</span>
                <span className={`log-badge ${badge.cls}`}>{badge.label}</span>
                <span className="log-msg">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
