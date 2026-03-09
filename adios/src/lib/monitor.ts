import { ethers } from "ethers";
import { UNISWAP_V3_POOL_ABI } from "./abi/uniswapV3Pool";
import {
  NONFUNGIBLE_POSITION_MANAGER_ABI,
  POSITION_MANAGER_ADDRESS,
} from "./abi/nonfungiblePositionManager";
import { DEFAULT_RISK_THRESHOLD } from "./config";
import type { PoolState, PositionData, RiskAssessment } from "@/types";

export class PositionMonitor {
  private provider: ethers.JsonRpcProvider;
  private poolContract: ethers.Contract;
  private positionManager: ethers.Contract;
  private riskThreshold: number;

  constructor(rpcUrl: string, poolAddress: string, riskThreshold?: number) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.poolContract = new ethers.Contract(
      poolAddress,
      UNISWAP_V3_POOL_ABI,
      this.provider
    );
    this.positionManager = new ethers.Contract(
      POSITION_MANAGER_ADDRESS,
      NONFUNGIBLE_POSITION_MANAGER_ABI,
      this.provider
    );
    this.riskThreshold =
      riskThreshold ?? Number(process.env.RISK_THRESHOLD) ?? DEFAULT_RISK_THRESHOLD;
  }

  async getPoolState(): Promise<PoolState> {
    const slot0 = await this.poolContract.slot0();
    return {
      currentTick: Number(slot0.tick),
      sqrtPriceX96: slot0.sqrtPriceX96.toString(),
      observationIndex: Number(slot0.observationIndex),
      observationCardinality: Number(slot0.observationCardinality),
      feeProtocol: Number(slot0.feeProtocol),
      unlocked: slot0.unlocked,
    };
  }

  async getPositionData(tokenId: string): Promise<PositionData> {
    const position = await this.positionManager.positions(tokenId);
    const token0 = await this.poolContract.token0();
    const token1 = await this.poolContract.token1();
    const fee = await this.poolContract.fee();

    return {
      tokenId,
      token0,
      token1,
      token0Symbol: "TOKEN0",
      token1Symbol: "TOKEN1",
      tickLower: Number(position.tickLower),
      tickUpper: Number(position.tickUpper),
      liquidity: position.liquidity.toString(),
      fee: Number(fee),
    };
  }

  assessRisk(
    currentTick: number,
    tickLower: number,
    tickUpper: number,
    positionId: string
  ): RiskAssessment {
    const distanceToLower = Math.abs(currentTick - tickLower);
    const distanceToUpper = Math.abs(currentTick - tickUpper);
    const range = tickUpper - tickLower;
    const minDistance = Math.min(distanceToLower, distanceToUpper);

    let riskLevel: RiskAssessment["riskLevel"];
    let riskScore: number;

    if (currentTick < tickLower || currentTick > tickUpper) {
      riskLevel = "OUT_OF_RANGE";
      riskScore = 100;
    } else if (minDistance <= this.riskThreshold / 2) {
      riskLevel = "CRITICAL";
      riskScore = 85 + (1 - minDistance / (this.riskThreshold / 2)) * 15;
    } else if (minDistance <= this.riskThreshold) {
      riskLevel = "WARNING";
      riskScore =
        50 + ((this.riskThreshold - minDistance) / this.riskThreshold) * 35;
    } else {
      riskLevel = "SAFE";
      riskScore = Math.max(
        0,
        50 - ((minDistance - this.riskThreshold) / range) * 50
      );
    }

    return {
      positionId,
      currentTick,
      tickLower,
      tickUpper,
      distanceToLower,
      distanceToUpper,
      riskLevel,
      riskScore: Math.round(riskScore * 100) / 100,
      timestamp: Date.now(),
    };
  }

  async getGasPrice(): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      const gwei = feeData.gasPrice
        ? Number(feeData.gasPrice / 1_000_000_000n)
        : 0;
      return gwei.toFixed(2);
    } catch {
      return "0";
    }
  }

  shouldEvacuate(risk: RiskAssessment): boolean {
    return risk.riskLevel === "CRITICAL" || risk.riskLevel === "OUT_OF_RANGE";
  }
}
