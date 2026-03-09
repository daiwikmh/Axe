import type { RiskAssessment } from "@/types";

export interface LLMDecision {
  action: "EVACUATE" | "WAIT" | "PARTIAL";
  reason: string;
  confidence: number;
}

export async function getLLMDecision(
  risk: RiskAssessment,
  gasPriceGwei: string
): Promise<LLMDecision> {
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  // Fallback: deterministic threshold logic if no LLM key
  if (!apiKey) {
    return fallbackDecision(risk);
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://adios.app",
          "X-Title": "adios LP Guardian",
        },
        body: JSON.stringify({
          model:
            process.env.NEXT_PUBLIC_OPENROUTER_MODEL ||
            "nvidia/nemotron-3-nano-30b-a3b:free",
          messages: [
            {
              role: "system",
              content:
                "You are an autonomous DeFi risk manager protecting Uniswap V3 LP positions. Analyze risk data and decide whether to evacuate capital. Respond ONLY with valid JSON — no markdown, no explanation outside the JSON.",
            },
            {
              role: "user",
              content: `Uniswap V3 position risk data:
- Risk Level: ${risk.riskLevel}
- Risk Score: ${risk.riskScore}% (100% = critical)
- Current Tick: ${risk.currentTick}
- Range: [${risk.tickLower}, ${risk.tickUpper}]
- Distance to lower bound: ${risk.distanceToLower} ticks
- Distance to upper bound: ${risk.distanceToUpper} ticks
- Gas price: ${gasPriceGwei} gwei

Rules:
- EVACUATE if risk > 80% or OUT_OF_RANGE or CRITICAL
- PARTIAL if risk 60-80% (withdraw half, keep monitoring)
- WAIT if risk < 60%

Respond with this exact JSON:
{"action":"EVACUATE|WAIT|PARTIAL","reason":"one sentence","confidence":0-100}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );

    if (!response.ok) {
      console.error("LLM API error:", response.status);
      return fallbackDecision(risk);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return fallbackDecision(risk);

    const parsed = JSON.parse(content) as LLMDecision;
    if (!["EVACUATE", "WAIT", "PARTIAL"].includes(parsed.action)) {
      return fallbackDecision(risk);
    }

    return parsed;
  } catch (err) {
    console.error("LLM decision failed:", err);
    return fallbackDecision(risk);
  }
}

function fallbackDecision(risk: RiskAssessment): LLMDecision {
  if (risk.riskLevel === "OUT_OF_RANGE" || risk.riskLevel === "CRITICAL") {
    return {
      action: "EVACUATE",
      reason: `Position ${risk.riskLevel} — immediate evacuation required`,
      confidence: 95,
    };
  }
  if (risk.riskLevel === "WARNING") {
    return {
      action: "WAIT",
      reason: "Risk elevated but within tolerable range — continue monitoring",
      confidence: 70,
    };
  }
  return {
    action: "WAIT",
    reason: "Position is safe, no action needed",
    confidence: 99,
  };
}
