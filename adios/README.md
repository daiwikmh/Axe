# brahma

**Autonomous DeFi Operations System** — a dual-mode AI agent built for the LI.FI Vibeathon. It runs two fully autonomous strategies from a single dashboard: a cross-chain USDC Yielder powered by Aave V3 + LI.FI, and an LP position guardian that watches Uniswap V3 pools and evacuates liquidity when risk thresholds are breached.

---

## Modes

### Yielder
Continuously scans USDC yield across 10 DeFi protocols on 4 chains using the DeFiLlama API. When the best available APY on another chain beats the current position by more than 0.1%, an LLM makes the final call (MOVE / STAY / WITHDRAW). If approved, the agent:

1. Withdraws USDC from the current Aave V3 position
2. Bridges cross-chain via LI.FI SDK (`getRoutes` → `executeRoute`)
3. Deposits into Aave V3 on the target chain

Supports **Simulation (Dry Run)** and **Live** modes. In dry-run, all actions are validated via `simulateContract` and `eth_call` without submitting transactions.

### Guardian
Monitors a Uniswap V3 LP position tick in real time. If tick delta exceeds the configured risk threshold, an LLM evaluates the position (EVACUATE / WAIT / PARTIAL). On evacuation, it withdraws liquidity via the NFT Position Manager and bridges assets to the target chain via LI.FI.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (all via `globals.css`) |
| Fonts | Space Grotesk + JetBrains Mono |
| Wallet | wagmi v3 + viem v2 + MetaMask (`injected` connector) |
| React Query | TanStack Query v5 |
| Charts | Recharts v3 |
| Icons | Lucide React |
| Package Manager | bun |

### Key Protocol Integrations

| Protocol | Usage |
|---|---|
| **LI.FI SDK** (`@lifi/sdk ^3.15.7`) | Cross-chain bridging — `getRoutes`, `executeRoute`, `getStepTransaction` |
| **Aave V3** | USDC supply / withdraw on Base, Arbitrum, Optimism, Polygon |
| **Uniswap V3** | Pool tick monitoring + NFT position manager withdrawal |
| **DeFiLlama API** | Live yield scanning across 10 protocols (60s cache) |
| **OpenRouter** | LLM decisions (MOVE/STAY/EVACUATE) via `nvidia/nemotron-3-nano-30b-a3b:free` |
| **Flashbots Protect** | MEV-protected RPC for Guardian evacuations |
| **Alchemy** | Write RPCs for all 4 yield chains (approve, supply, withdraw, bridge tx) |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── agent/route.ts          # Guardian agent API (start/stop/simulate/reset)
│   │   └── yield-agent/route.ts    # Yield agent API (start/stop/reset/set-mode/set-allocation/fetch-balances)
│   ├── globals.css                 # All styling — CSS vars + component classes
│   ├── layout.tsx                  # Root layout (fonts + Providers)
│   └── page.tsx                    # Entry point
│
├── components/
│   ├── shared/
│   │   ├── Dashboard.tsx           # Dual-mode layout, polls both APIs every 2s
│   │   ├── Sidebar.tsx             # Mode tabs, nav, execution toggle, Powered By
│   │   ├── Providers.tsx           # wagmi + React Query setup
│   │   └── WalletButton.tsx        # MetaMask connect/disconnect
│   ├── guardian/
│   │   ├── AgentPanel.tsx          # Guardian right panel — status, metrics, connections
│   │   ├── ControlPanel.tsx        # Start/stop/simulate risk controls
│   │   ├── StatsCards.tsx          # Guardian stats — uptime, checks, evacuations
│   │   ├── TickChart.tsx           # Recharts tick movement area chart
│   │   ├── RiskGauge.tsx           # Animated half-circle risk score gauge
│   │   ├── ActivityLog.tsx         # Terminal-style log viewer
│   │   └── EvacuationPanel.tsx     # Evacuation history with bridge routes
│   └── yield/
│       ├── YieldAgentPanel.tsx     # Right panel — balance, allocation, fund agent
│       ├── YieldDepositWidget.tsx  # MetaMask → agent wallet USDC transfer
│       ├── YieldTable.tsx          # Collapsible scanner table (10 protocols)
│       ├── YieldControlPanel.tsx   # Start/stop/reset + mode banner
│       ├── YieldStatsCards.tsx     # Balance, APY, chain, move count cards
│       └── YieldMoveHistory.tsx    # Tabbed simulated vs live move history
│
├── lib/
│   ├── shared/
│   │   ├── config.ts               # Chain configs, token addresses, constants
│   │   ├── wagmi.ts                # wagmi createConfig (injected MetaMask)
│   │   └── lifiClient.ts           # LI.FI SDK singleton (createConfig, idempotent)
│   ├── guardian/
│   │   ├── agent.ts                # Guardian polling loop
│   │   ├── monitor.ts              # Uniswap V3 pool tick + LP position monitoring
│   │   ├── executor.ts             # Withdrawal + LI.FI bridge execution
│   │   └── llm.ts                  # OpenRouter decisions (EVACUATE/WAIT/PARTIAL)
│   ├── yield/
│   │   ├── yieldAgent.ts           # Main Yielder loop + state management
│   │   ├── yieldScanner.ts         # DeFiLlama multi-protocol USDC yield scanner
│   │   ├── aaveDepositor.ts        # Aave V3 supply/withdraw via viem
│   │   ├── yieldBridge.ts          # LI.FI bridge for yield moves
│   │   └── yieldLlm.ts             # LLM decision engine (MOVE/STAY/WITHDRAW)
│   └── abi/
│       ├── aaveV3Pool.ts           # Aave V3 Pool + ERC20 ABI
│       ├── uniswapV3Pool.ts        # Uniswap V3 Pool ABI
│       └── nonfungiblePositionManager.ts
│
└── types/index.ts                  # Shared TypeScript types
```

---

## LI.FI SDK Integration

brahma uses the LI.FI SDK as the sole bridging layer for both modes. All cross-chain moves go through LI.FI.

### SDK Setup (`lib/shared/lifiClient.ts`)

The SDK is initialized once as a singleton using `createConfig`. Subsequent calls are idempotent. The config sets up EVM providers using `txRpcUrl` (Alchemy) per chain so that `executeRoute` has reliable signing RPC.

```ts
import { createConfig, EVM } from "@lifi/sdk";
import { createWalletClient, http } from "viem";

initLiFi(); // safe to call multiple times — singleton guard
```

### Yielder Bridge Flow (`lib/yield/yieldBridge.ts`)

```
getRoutes({ fromChain, toChain, fromToken: USDC, toToken: USDC, fromAmount })
  → pick best route (routes[0])
  → DRY RUN: getStepTransaction(step) → publicClient.call (eth_call) — validates calldata
  → LIVE:    executeRoute(route, { updateRouteHook }) — submits on-chain
```

**Key details:**
- Token: native USDC (not USDC.e) on all chains
- `fromAmountForGas` is estimated and deducted so the agent wallet retains gas
- ERC20 approval is checked and submitted before bridging if allowance is insufficient
- `updateRouteHook` streams live step status to the agent log

### Guardian Evacuation Flow (`lib/guardian/executor.ts`)

```
Remove liquidity via NonfungiblePositionManager.decreaseLiquidity + collect
  → getRoutes (token → USDC on target chain)
  → executeRoute
```

### Dry Run Mode

In dry run, `getStepTransaction` enriches a route step with real calldata, then `publicClient.call` runs the transaction as an `eth_call`. Aave approval-gated reverts are expected and caught — they confirm the route is valid without submitting. `simulateContract` is used for Aave supply/withdraw validation.

---

## Yielder — Supported Protocols

The scanner queries DeFiLlama for USDC pools across these protocols:

| Protocol | Actionable (agent moves to) |
|---|---|
| Aave V3 | Yes |
| Compound V3 | No (UI only) |
| Morpho Blue | No (UI only) |
| Morpho | No (UI only) |
| Moonwell | No (UI only) |
| Seamless Protocol | No (UI only) |
| Fluid | No (UI only) |
| Spark | No (UI only) |
| Euler | No (UI only) |
| Ionic Protocol | No (UI only) |

Only `actionable: true` pools are passed to the LLM and acted on. Non-actionable pools appear dimmed in the UI for market context.

### Move Threshold

`MIN_APY_DIFF_TO_MOVE = 0.1%` — the best available APY must beat the current position by at least 0.1% to trigger a move evaluation.

---

## Supported Chains

### Yielder

| Chain | Chain ID | USDC Address | Aave V3 Pool | aToken |
|---|---|---|---|---|
| Base | 8453 | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` | `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB` |
| Arbitrum | 42161 | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | `0x724dc807b04555b71ed48a6896b6F41593b8C637` |
| Optimism | 10 | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | `0x38d693cE1dF5AaDF7bC62043aE5EF4e45a3d37Bd` |
| Polygon | 137 | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | `0xA4D94019934D8333Ef880ABFFbF2FDd611C762BD` |

### Guardian

| Chain | Chain ID | RPC |
|---|---|---|
| Ethereum | 1 | Flashbots Protect (MEV-shielded) |
| Arbitrum | 42161 | Public RPC |
| Base | 8453 | Alchemy |
| Optimism | 10 | Public RPC |
| Polygon | 137 | Alchemy |

### RPC Strategy

Each yield chain uses two RPCs:
- `rpcUrl` — public RPC for reads, `balanceOf`, `simulateContract`, dry-run `eth_call` (no rate-limit risk)
- `txRpcUrl` — Alchemy for writes: `approve`, `supply`, `withdraw`, bridge tx submission

---

## Environment Variables

```env
# Agent Wallet
PRIVATE_KEY=0x...                          # Agent hot wallet private key

# Guardian Mode
RPC_URL=https://rpc.flashbots.net          # MEV-protected RPC (Flashbots Protect)
POOL_ADDRESS=0xd0b53D9277642d899DF5C87A3966A349A798F224   # Uniswap V3 pool to monitor
POSITION_NFT_ID=123456                     # Uniswap V3 LP NFT token ID
TICK_LOWER=-887220                         # Position tick range lower bound
TICK_UPPER=887220                          # Position tick range upper bound
RISK_THRESHOLD=500                         # Tick delta threshold for evacuation (basis points)
POLL_INTERVAL_MS=60000                     # Guardian poll interval (ms)
TARGET_CHAIN_ID=8453                       # Chain to bridge assets to on evacuation
TARGET_ADDRESS=0x...                       # Destination wallet for evacuated funds

# LI.FI
LIFI_INTEGRATOR=brahma                      # LI.FI integrator ID

# OpenRouter LLM
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-... # Exposed to client for UI display
NEXT_PUBLIC_OPENROUTER_MODEL=nvidia/nemotron-3-nano-30b-a3b:free

# App
NEXT_PUBLIC_APP_NAME=brahma
```

---

## Getting Started

### Prerequisites

- [bun](https://bun.sh) >= 1.0
- Node.js >= 20
- MetaMask browser extension
- An agent wallet funded with a small amount of ETH on each chain (for gas)
- USDC in the agent wallet on at least one yield chain to start hunting

### Install & Run

```bash
# Clone
git clone <repo-url>
cd brahma

# Install dependencies
bun install

# Copy and fill env
cp .env.example .env.local
# Edit .env.local with your keys

# Development
bun dev

# Production build
bun run build
bun start
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Reference

### `GET /api/yield-agent`
Returns the current `YieldAgentState` snapshot including balances, move history, logs, and status.

### `POST /api/yield-agent`

| Action | Body | Description |
|---|---|---|
| `start` | `{ action: "start" }` | Start the yield hunting loop |
| `stop` | `{ action: "stop" }` | Stop the loop |
| `reset` | `{ action: "reset" }` | Reset state and stop |
| `set-mode` | `{ action: "set-mode", mode: "DRY_RUN" \| "LIVE" }` | Switch execution mode |
| `set-allocation` | `{ action: "set-allocation", amount: string }` | Set USDC cap (raw 6-dec string, "0" = all) |
| `fetch-balances` | `{ action: "fetch-balances" }` | Force immediate balance refresh (bypasses 2min throttle) |

### `GET /api/agent`
Returns the current `AgentState` for Guardian mode.

### `POST /api/agent`

| Action | Body | Description |
|---|---|---|
| `start` | `{ action: "start" }` | Start Guardian monitoring loop |
| `stop` | `{ action: "stop" }` | Stop monitoring |
| `reset` | `{ action: "reset" }` | Reset state |
| `simulate` | `{ action: "simulate", riskScore: number }` | Inject a simulated risk score for testing |

---

## Agent State

### `YieldAgentState`

```ts
{
  status: "IDLE" | "SCANNING" | "MONITORING" | "BRIDGING" | "DEPOSITING" | "WITHDRAWING" | "ERROR";
  mode: "DRY_RUN" | "LIVE";
  currentPosition: YieldPosition | null;   // Active Aave deposit
  lastScan: number;                         // Unix timestamp of last DeFiLlama scan
  lastYields: YieldPool[];                  // All pools from last scan
  bestYield: YieldPool | null;             // Top actionable pool
  logs: LogEntry[];                         // Rolling agent log (last 200)
  uptime: number;                           // ms since start
  scansPerformed: number;
  movesPerformed: number;
  simulatedMoves: YieldMoveResult[];        // Dry-run move history
  liveMoves: YieldMoveResult[];             // Live move history
  walletBalances: Record<number, ChainBalance>; // Per-chain USDC + aToken
  totalBalance: string;                     // Sum across all chains (raw 6-dec)
  allocatedAmount: string;                  // Cap on managed amount (raw 6-dec)
  agentAddress: string;                     // Derived from PRIVATE_KEY
}
```

---

## Design

- **Theme:** `#070709` background, `#18181B` surfaces, `#E1C4E9` accent purple, `#00FFE0` neon cyan, `#FF2D78` neon pink
- **Typography:** Space Grotesk (UI text) + JetBrains Mono (numbers, addresses, code)
- **All styles** live in `src/app/globals.css` via CSS custom properties and component classes — no inline Tailwind utilities
- No icons in tabs, nav buttons, or labels — text only

---

## Built For

**LI.FI Vibeathon** — demonstrating autonomous cross-chain DeFi agents powered by the LI.FI SDK for intelligent liquidity routing.
