export interface PositionData {
  tokenId: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  fee: number;
}

export interface PoolState {
  currentTick: number;
  sqrtPriceX96: string;
  observationIndex: number;
  observationCardinality: number;
  feeProtocol: number;
  unlocked: boolean;
}

export interface RiskAssessment {
  positionId: string;
  currentTick: number;
  tickLower: number;
  tickUpper: number;
  distanceToLower: number;
  distanceToUpper: number;
  riskLevel: "SAFE" | "WARNING" | "CRITICAL" | "OUT_OF_RANGE";
  riskScore: number; // 0-100
  timestamp: number;
}

export interface EvacuationResult {
  success: boolean;
  txHash?: string;
  token0Amount?: string;
  token1Amount?: string;
  bridgeRoute?: BridgeRoute;
  error?: string;
  timestamp: number;
}

export interface BridgeRoute {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  estimatedOutput: string;
  bridgeUsed: string;
  executionTime: number;
}

export interface AgentState {
  status: "IDLE" | "MONITORING" | "EVACUATING" | "BRIDGING" | "ERROR" | "PAUSED";
  lastCheck: number;
  lastRisk: RiskAssessment | null;
  evacuationHistory: EvacuationResult[];
  logs: LogEntry[];
  uptime: number;
  checksPerformed: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  message: string;
  data?: Record<string, unknown>;
}

export type ChainConfig = {
  chainId: number;
  name: string;
  rpcUrl: string;
  privateRpcUrl?: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};
