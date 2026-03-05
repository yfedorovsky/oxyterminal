// ---------------------------------------------------------------------------
// Tradier API Service
// Production endpoint with ORATS Greeks support
// ---------------------------------------------------------------------------

const TRADIER_BASE = "https://api.tradier.com/v1";

function getHeaders(): HeadersInit {
  const apiKey = process.env.TRADIER_API_KEY;
  if (!apiKey) throw new Error("TRADIER_API_KEY not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
}

async function tradierFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${TRADIER_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tradier API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types for Tradier API responses
// ---------------------------------------------------------------------------

export interface TradierQuote {
  symbol: string;
  description: string;
  last: number;
  change: number;
  change_percentage: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
  bid: number;
  ask: number;
  bidsize: number;
  asksize: number;
  prevclose: number;
  week_52_high: number;
  week_52_low: number;
}

export interface TradierGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  phi: number;
  mid_iv: number;
  smv_vol: number;
  bid_iv: number;
  ask_iv: number;
  updated_at: string;
}

export interface TradierOption {
  symbol: string;
  description: string;
  exch: string;
  type: string; // "put" or "call"
  last: number | null;
  change: number | null;
  volume: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  bid: number;
  ask: number;
  underlying: string;
  strike: number;
  change_percentage: number | null;
  average_volume: number;
  last_volume: number;
  trade_date: number;
  prevclose: number | null;
  week_52_high: number;
  week_52_low: number;
  bidsize: number;
  asksize: number;
  open_interest: number;
  contract_size: number;
  expiration_date: string;
  expiration_type: string;
  option_type: string; // "call" or "put"
  root_symbol: string;
  greeks?: TradierGreeks;
}

export interface TradierExpiration {
  date: string;
  contract_size: number;
  expiration_type: string;
  strikes?: { strike: number[] };
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

/** Get a stock quote */
export async function getQuote(symbol: string): Promise<TradierQuote> {
  const data = await tradierFetch<{ quotes: { quote: TradierQuote | TradierQuote[] } }>(
    "/markets/quotes",
    { symbols: symbol, greeks: "false" }
  );
  const q = data.quotes.quote;
  return Array.isArray(q) ? q[0] : q;
}

/** Get available options expirations for a symbol */
export async function getExpirations(symbol: string): Promise<string[]> {
  const data = await tradierFetch<{
    expirations: { date: string[] } | { expiration: TradierExpiration[] } | null;
  }>("/markets/options/expirations", { symbol, includeAllRoots: "true" });

  if (!data.expirations) return [];

  // Tradier returns either { date: string[] } or { expiration: [...] }
  if ("date" in data.expirations) {
    return data.expirations.date;
  }
  if ("expiration" in data.expirations) {
    return data.expirations.expiration.map((e) => e.date);
  }
  return [];
}

/** Get options chain for a symbol and expiration, with ORATS Greeks */
export async function getOptionsChain(
  symbol: string,
  expiration: string
): Promise<TradierOption[]> {
  const data = await tradierFetch<{
    options: { option: TradierOption[] } | null;
  }>("/markets/options/chains", {
    symbol,
    expiration,
    greeks: "true",
  });

  if (!data.options?.option) return [];
  return data.options.option;
}

/** Get options chain strikes for a symbol and expiration */
export async function getStrikes(
  symbol: string,
  expiration: string
): Promise<number[]> {
  const data = await tradierFetch<{
    strikes: { strike: number[] } | null;
  }>("/markets/options/strikes", {
    symbol,
    expiration,
  });

  if (!data.strikes?.strike) return [];
  return data.strikes.strike;
}
