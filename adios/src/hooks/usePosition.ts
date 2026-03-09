"use client";

import { useAccount, useReadContracts } from "wagmi";
import { useMemo } from "react";

const NONFUNGIBLE_POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88" as const;

const positionManagerAbi = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "positions",
    outputs: [
      { name: "nonce", type: "uint96" },
      { name: "operator", type: "address" },
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickLower", type: "int24" },
      { name: "tickUpper", type: "int24" },
      { name: "liquidity", type: "uint128" },
      { name: "feeGrowthInside0LastX128", type: "uint256" },
      { name: "feeGrowthInside1LastX128", type: "uint256" },
      { name: "tokensOwed0", type: "uint128" },
      { name: "tokensOwed1", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const erc20Abi = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface PositionInfo {
  tokenId: bigint;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
}

export function usePositions() {
  const { address, isConnected, chain } = useAccount();

  // Step 1: get how many positions the wallet owns
  const { data: balanceData } = useReadContracts({
    contracts: [
      {
        address: NONFUNGIBLE_POSITION_MANAGER,
        abi: positionManagerAbi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: chain?.id ?? 1,
      },
    ],
    query: { enabled: isConnected && !!address },
  });

  const positionCount = balanceData?.[0]?.result
    ? Number(balanceData[0].result)
    : 0;

  // Step 2: get token IDs (up to 5)
  const tokenIdContracts = useMemo(() => {
    if (!address || positionCount === 0) return [];
    const count = Math.min(positionCount, 5);
    return Array.from({ length: count }, (_, i) => ({
      address: NONFUNGIBLE_POSITION_MANAGER as `0x${string}`,
      abi: positionManagerAbi,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [address, BigInt(i)] as const,
      chainId: chain?.id ?? 1,
    }));
  }, [address, positionCount, chain?.id]);

  const { data: tokenIdData } = useReadContracts({
    contracts: tokenIdContracts,
    query: { enabled: tokenIdContracts.length > 0 },
  });

  const tokenIds = useMemo(() => {
    if (!tokenIdData) return [];
    return tokenIdData
      .filter((r) => r.status === "success" && r.result !== undefined)
      .map((r) => r.result as bigint);
  }, [tokenIdData]);

  // Step 3: get position details for each token ID
  const positionContracts = useMemo(() => {
    return tokenIds.map((id) => ({
      address: NONFUNGIBLE_POSITION_MANAGER as `0x${string}`,
      abi: positionManagerAbi,
      functionName: "positions" as const,
      args: [id] as const,
      chainId: chain?.id ?? 1,
    }));
  }, [tokenIds, chain?.id]);

  const { data: positionData } = useReadContracts({
    contracts: positionContracts,
    query: { enabled: positionContracts.length > 0 },
  });

  // Step 4: resolve token symbols
  const tokenAddresses = useMemo(() => {
    if (!positionData) return [];
    const addrs = new Set<string>();
    for (const p of positionData) {
      if (p.status === "success" && p.result) {
        const res = p.result as readonly [
          bigint, string, string, string, number, number, number, bigint,
          bigint, bigint, bigint, bigint
        ];
        addrs.add(res[2]); // token0
        addrs.add(res[3]); // token1
      }
    }
    return Array.from(addrs);
  }, [positionData]);

  const symbolContracts = useMemo(() => {
    return tokenAddresses.map((addr) => ({
      address: addr as `0x${string}`,
      abi: erc20Abi,
      functionName: "symbol" as const,
      chainId: chain?.id ?? 1,
    }));
  }, [tokenAddresses, chain?.id]);

  const { data: symbolData } = useReadContracts({
    contracts: symbolContracts,
    query: { enabled: symbolContracts.length > 0 },
  });

  const symbolMap = useMemo(() => {
    const map: Record<string, string> = {};
    tokenAddresses.forEach((addr, i) => {
      if (symbolData?.[i]?.status === "success") {
        map[addr.toLowerCase()] = symbolData[i].result as string;
      }
    });
    return map;
  }, [tokenAddresses, symbolData]);

  // Step 5: combine into final positions
  const positions: PositionInfo[] = useMemo(() => {
    if (!positionData) return [];
    return positionData
      .map((p, i) => {
        if (p.status !== "success" || !p.result) return null;
        const res = p.result as readonly [
          bigint, string, string, string, number, number, number, bigint,
          bigint, bigint, bigint, bigint
        ];
        const token0 = res[2];
        const token1 = res[3];
        return {
          tokenId: tokenIds[i],
          token0,
          token1,
          token0Symbol: symbolMap[token0.toLowerCase()] || "???",
          token1Symbol: symbolMap[token1.toLowerCase()] || "???",
          fee: Number(res[4]),
          tickLower: Number(res[5]),
          tickUpper: Number(res[6]),
          liquidity: res[7] as bigint,
        };
      })
      .filter((p): p is PositionInfo => p !== null && p.liquidity > 0n);
  }, [positionData, tokenIds, symbolMap]);

  return {
    positions,
    positionCount,
    isConnected,
    chain,
    isLoading: isConnected && positionCount > 0 && positions.length === 0,
  };
}
