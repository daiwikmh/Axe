import { PositionMonitor } from "./monitor";
import { EvacuationExecutor } from "./executor";
import { getLLMDecision } from "./llm";
import type { AgentState, LogEntry, RiskAssessment } from "@/types";

let agentState: AgentState = {
  status: "IDLE",
  lastCheck: 0,
  lastRisk: null,
  evacuationHistory: [],
  logs: [],
  uptime: Date.now(),
  checksPerformed: 0,
};

let pollInterval: ReturnType<typeof setInterval> | null = null;

function addLog(entry: Omit<LogEntry, "id">) {
  const log: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
  };
  agentState.logs = [log, ...agentState.logs].slice(0, 200);
}

export function getAgentState(): AgentState {
  return { ...agentState };
}

export function resetAgent() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
  agentState = {
    status: "IDLE",
    lastCheck: 0,
    lastRisk: null,
    evacuationHistory: [],
    logs: [],
    uptime: Date.now(),
    checksPerformed: 0,
  };
}

export function startAgent(config: {
  rpcUrl: string;
  poolAddress: string;
  positionTokenId: string;
  tickLower: number;
  tickUpper: number;
  riskThreshold: number;
  pollIntervalMs: number;
  fromChainId: number;
  privateKey?: string;
  privateRpcUrl?: string;
  targetChainId?: number;
  targetToken?: string;
}) {
  if (
    agentState.status === "MONITORING" ||
    agentState.status === "EVACUATING"
  ) {
    addLog({
      timestamp: Date.now(),
      level: "WARN",
      message: "Agent already running",
    });
    return;
  }

  const monitor = new PositionMonitor(
    config.rpcUrl,
    config.poolAddress,
    config.riskThreshold
  );

  const executor =
    config.privateKey
      ? new EvacuationExecutor(
          config.rpcUrl,
          config.privateKey,
          config.fromChainId,
          config.privateRpcUrl,
          (log) => addLog(log)
        )
      : null;

  agentState.status = "MONITORING";
  agentState.uptime = Date.now();

  addLog({
    timestamp: Date.now(),
    level: "INFO",
    message: `brahma agent started — monitoring pool ${config.poolAddress.slice(0, 10)}... every ${config.pollIntervalMs / 1000}s`,
  });

  if (!executor) {
    addLog({
      timestamp: Date.now(),
      level: "WARN",
      message: "No private key — running in read-only mode",
    });
  }

  const runCheck = async () => {
    if (
      agentState.status === "EVACUATING" ||
      agentState.status === "BRIDGING"
    ) {
      return; // don't interrupt active evacuation
    }

    try {
      const [poolState, gasPrice] = await Promise.all([
        monitor.getPoolState(),
        monitor.getGasPrice(),
      ]);

      const risk = monitor.assessRisk(
        poolState.currentTick,
        config.tickLower,
        config.tickUpper,
        config.positionTokenId
      );

      agentState.lastRisk = risk;
      agentState.lastCheck = Date.now();
      agentState.checksPerformed++;

      const tickInfo = `Tick: ${poolState.currentTick} | Range: [${config.tickLower}, ${config.tickUpper}] | Risk: ${risk.riskScore}%`;

      if (risk.riskLevel === "SAFE") {
        addLog({ timestamp: Date.now(), level: "INFO", message: `${tickInfo} — SAFE` });
        return;
      }

      if (risk.riskLevel === "WARNING") {
        addLog({ timestamp: Date.now(), level: "WARN", message: `${tickInfo} — APPROACHING BOUNDS` });
      }

      // For CRITICAL or OUT_OF_RANGE — ask the LLM
      if (risk.riskLevel === "CRITICAL" || risk.riskLevel === "OUT_OF_RANGE") {
        addLog({ timestamp: Date.now(), level: "WARN", message: `${tickInfo} — consulting AI decision engine...` });

        const decision = await getLLMDecision(risk, gasPrice);

        addLog({
          timestamp: Date.now(),
          level: decision.action === "EVACUATE" ? "ERROR" : "WARN",
          message: `AI Decision: ${decision.action} (${decision.confidence}% confidence) — ${decision.reason}`,
        });

        if (decision.action === "WAIT") return;

        if (!executor) {
          addLog({
            timestamp: Date.now(),
            level: "ERROR",
            message: "Cannot execute — no private key configured",
          });
          return;
        }

        // Fetch live position data for real token addresses + liquidity
        let positionData;
        try {
          positionData = await monitor.getPositionData(config.positionTokenId);
        } catch {
          addLog({
            timestamp: Date.now(),
            level: "ERROR",
            message: `Failed to fetch position data for #${config.positionTokenId}`,
          });
          return;
        }

        const liquidityToWithdraw =
          decision.action === "PARTIAL"
            ? (BigInt(positionData.liquidity) / 2n).toString()
            : positionData.liquidity;

        agentState.status = "EVACUATING";
        addLog({
          timestamp: Date.now(),
          level: "WARN",
          message: `=== EXECUTING ${decision.action === "PARTIAL" ? "PARTIAL " : ""}EVACUATION — NFT #${config.positionTokenId} ===`,
        });

        const result = await executor.executeEvacuation(
          config.positionTokenId,
          liquidityToWithdraw,
          positionData.token0,
          positionData.token1,
          config.fromChainId,
          config.targetChainId ?? 8453,
          config.targetToken ?? "0x0000000000000000000000000000000000000000" // native ETH on target
        );

        agentState.evacuationHistory.push(result);
        agentState.status = result.success ? "MONITORING" : "ERROR";

        addLog({
          timestamp: Date.now(),
          level: result.success ? "SUCCESS" : "ERROR",
          message: result.success
            ? `Evacuation complete — bridged to chain ${config.targetChainId ?? 8453} via ${result.bridgeRoute?.bridgeUsed}`
            : `Evacuation failed: ${result.error}`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog({
        timestamp: Date.now(),
        level: "ERROR",
        message: `Monitor check failed: ${message}`,
      });
    }
  };

  runCheck();
  pollInterval = setInterval(runCheck, config.pollIntervalMs);
}

export function stopAgent() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  agentState.status = "PAUSED";
  addLog({ timestamp: Date.now(), level: "INFO", message: "Agent stopped" });
}

export function simulateRisk(level: RiskAssessment["riskLevel"]) {
  const tickLower = -887220;
  const tickUpper = 887220;
  const scenarios: Record<RiskAssessment["riskLevel"], number> = {
    SAFE: 0,
    WARNING: tickUpper - 400,
    CRITICAL: tickUpper - 100,
    OUT_OF_RANGE: tickUpper + 500,
  };

  const currentTick = scenarios[level];
  const monitor = new PositionMonitor(
    process.env.RPC_URL || "",
    "",
    Number(process.env.RISK_THRESHOLD) || 500
  );

  const risk = monitor.assessRisk(currentTick, tickLower, tickUpper, "DEMO");
  agentState.lastRisk = risk;
  agentState.lastCheck = Date.now();

  addLog({
    timestamp: Date.now(),
    level:
      level === "SAFE" ? "INFO" : level === "WARNING" ? "WARN" : "ERROR",
    message: `[SIM] ${level} | Tick: ${currentTick} | Score: ${risk.riskScore}%`,
  });
}
