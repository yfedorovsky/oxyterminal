// ---------------------------------------------------------------------------
// Perplexity Sonar API Service
// Real-time AI research briefs with web-grounded data
// ---------------------------------------------------------------------------

import type { AIResearchBrief } from "@/components/bloomberg/types";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar-pro";

// ---------------------------------------------------------------------------
// System prompt — adapted from mirbot/scripts/perplexity_scan.py
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a concise financial analyst powering a Bloomberg-style terminal.
Return ONLY valid JSON matching the exact schema below. No markdown, no code fences, no extra text.
Be specific with price levels, percentages, and dates. No disclaimers or boilerplate.
Focus on actionable intelligence: price levels, catalysts, risk/reward, and timing.`;

function buildUserPrompt(ticker: string, currentDate: string): string {
  return `Generate a research brief for $${ticker} as of ${currentDate}.

Return this EXACT JSON structure (no other text):
{
  "ticker": "${ticker}",
  "summary": "2-3 sentence overview of current situation, recent price action, and key thesis",
  "bullCase": [
    "First bullish argument with specific data points",
    "Second bullish argument with specific data points",
    "Third bullish argument with specific data points"
  ],
  "bearCase": [
    "First bearish argument with specific data points",
    "Second bearish argument with specific data points",
    "Third bearish argument with specific data points"
  ],
  "keyLevels": {
    "support": 0,
    "resistance": 0,
    "current": 0,
    "low52w": 0,
    "high52w": 0
  },
  "catalysts": [
    {"date": "YYYY-MM-DD", "description": "Upcoming event description"},
    {"date": "YYYY-MM-DD", "description": "Another upcoming event"}
  ],
  "verdict": "STRONG BUY | OVERWEIGHT | NEUTRAL | UNDERWEIGHT | SELL",
  "confidence": 65
}

Requirements:
- keyLevels.current = current stock price (accurate as of today)
- keyLevels.support = nearest technical support level
- keyLevels.resistance = nearest technical resistance level
- keyLevels.low52w and high52w = 52-week low and high
- catalysts = upcoming events within next 60 days (earnings, conferences, product launches, FDA dates, etc.)
- verdict = one of: STRONG BUY, OVERWEIGHT, NEUTRAL, UNDERWEIGHT, SELL
- confidence = 0-100 based on conviction strength
- bullCase and bearCase should each have exactly 3 specific, data-driven arguments
- All price levels must be real numbers, not placeholders`;
}

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

export async function generateResearchBrief(
  ticker: string
): Promise<AIResearchBrief> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY not set");
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(ticker, currentDate) },
    ],
    max_tokens: 2000,
    temperature: 0.1,
    return_citations: true,
  };

  const res = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Perplexity API ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";

  // Parse JSON from response — handle potential markdown fences
  const brief = parseResearchJSON(content, ticker);
  return brief;
}

// ---------------------------------------------------------------------------
// JSON parsing with fallback handling
// ---------------------------------------------------------------------------

function parseResearchJSON(
  raw: string,
  ticker: string
): AIResearchBrief {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate and normalize
    return {
      ticker: parsed.ticker || ticker,
      summary: parsed.summary || "Analysis unavailable.",
      bullCase: Array.isArray(parsed.bullCase)
        ? parsed.bullCase.slice(0, 5)
        : [],
      bearCase: Array.isArray(parsed.bearCase)
        ? parsed.bearCase.slice(0, 5)
        : [],
      keyLevels: {
        support: Number(parsed.keyLevels?.support) || 0,
        resistance: Number(parsed.keyLevels?.resistance) || 0,
        current: Number(parsed.keyLevels?.current) || 0,
        low52w: Number(parsed.keyLevels?.low52w) || 0,
        high52w: Number(parsed.keyLevels?.high52w) || 0,
      },
      catalysts: Array.isArray(parsed.catalysts)
        ? parsed.catalysts
            .filter(
              (c: { date?: string; description?: string }) =>
                c.date && c.description
            )
            .slice(0, 6)
        : [],
      verdict: parsed.verdict || "NEUTRAL",
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
    };
  } catch {
    // If JSON parsing fails completely, return a minimal brief
    console.error("[perplexity] Failed to parse research JSON:", raw.slice(0, 200));
    return {
      ticker,
      summary: raw.slice(0, 500) || "Failed to generate research brief.",
      bullCase: [],
      bearCase: [],
      keyLevels: { support: 0, resistance: 0, current: 0, low52w: 0, high52w: 0 },
      catalysts: [],
      verdict: "NEUTRAL",
      confidence: 0,
    };
  }
}
