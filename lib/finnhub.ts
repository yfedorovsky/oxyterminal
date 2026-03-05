// -----------------------------------------------------------------------------
// Finnhub API Service Layer
// Server-side only — do not import in client components.
// -----------------------------------------------------------------------------

// ─── Response Types ──────────────────────────────────────────────────────────

export interface FinnhubQuote {
  /** Current price */
  c: number;
  /** Change */
  d: number;
  /** Change percent */
  dp: number;
  /** High of the day */
  h: number;
  /** Low of the day */
  l: number;
  /** Open price */
  o: number;
  /** Previous close */
  pc: number;
  /** Timestamp (unix) */
  t: number;
}

export interface FinnhubCompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  finnhubIndustry: string;
}

export interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubFinancials {
  metric: Record<string, number | string | null>;
  metricType: string;
  series: Record<string, unknown>;
}

export interface FinnhubMarketStatus {
  exchange: string;
  holiday: string | null;
  isOpen: boolean;
  session: string;
  t: number;
  timezone: string;
}

export interface FinnhubEarningsEntry {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: string;
  quarter: number;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  year: number;
}

export interface FinnhubEarningsCalendar {
  earningsCalendar: FinnhubEarningsEntry[];
}

export interface FinnhubPriceTarget {
  lastUpdated: string;
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
}

export interface FinnhubRecommendation {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}

export interface FinnhubSocialSentimentEntry {
  atTime: string;
  mention: number;
  positiveScore: number;
  negativeScore: number;
  positiveMention: number;
  negativeMention: number;
  score: number;
}

export interface FinnhubSocialSentiment {
  reddit: FinnhubSocialSentimentEntry[];
  twitter: FinnhubSocialSentimentEntry[];
}

export interface FinnhubInsiderTransaction {
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionDate: string;
  transactionCode: string;
  transactionPrice: number;
}

export interface FinnhubInsiderTransactionsResponse {
  data: FinnhubInsiderTransaction[];
  symbol: string;
}

// ─── Service Class ───────────────────────────────────────────────────────────

export class FinnhubService {
  private apiKey: string;
  private baseUrl = "https://finnhub.io/api/v1";

  // In-memory quote cache: symbol → { data, timestamp }
  // Prevents duplicate API calls when QuoteMonitor + Heatmap request overlapping tickers
  private quoteCache = new Map<string, { data: FinnhubQuote; ts: number }>();
  private readonly CACHE_TTL = 25_000; // 25 seconds — aggressive caching to stay under 60/min

  // In-flight deduplication: if a symbol is already being fetched, reuse the promise
  private inFlight = new Map<string, Promise<FinnhubQuote>>();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generic fetch helper. Builds the full URL with token auth and optional
   * query parameters, then returns the parsed JSON body.
   */
  private async fetch<T>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set("token", this.apiKey);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString());

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Finnhub API error ${res.status} for ${endpoint}: ${body}`,
      );
    }

    return res.json() as Promise<T>;
  }

  // ── Stock Quotes ───────────────────────────────────────────────────────

  async getQuote(symbol: string): Promise<FinnhubQuote> {
    return this.fetch<FinnhubQuote>("/quote", { symbol });
  }

  /**
   * Deduplicated single-quote fetch. If a request for the same symbol is
   * already in-flight, reuse it instead of starting a duplicate.
   */
  private async getQuoteDeduped(symbol: string): Promise<FinnhubQuote> {
    const existing = this.inFlight.get(symbol);
    if (existing) return existing;

    const promise = this.getQuote(symbol).finally(() => {
      this.inFlight.delete(symbol);
    });
    this.inFlight.set(symbol, promise);
    return promise;
  }

  async getQuotes(symbols: string[]): Promise<(FinnhubQuote & { symbol: string })[]> {
    const now = Date.now();
    const results: (FinnhubQuote & { symbol: string })[] = [];
    const toFetch: string[] = [];

    // Split into cached vs. needs-fetch
    for (const symbol of symbols) {
      const entry = this.quoteCache.get(symbol);
      if (entry && now - entry.ts < this.CACHE_TTL) {
        results.push({ ...entry.data, symbol });
      } else {
        toFetch.push(symbol);
      }
    }

    // Fetch uncached symbols in small parallel batches with delay between
    if (toFetch.length > 0) {
      const BATCH_SIZE = 6; // small batches to stay under 60/min
      for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
        if (i > 0) {
          // Small delay between batches to pace requests
          await new Promise((r) => setTimeout(r, 200));
        }
        const batch = toFetch.slice(i, i + BATCH_SIZE);
        const settled = await Promise.allSettled(
          batch.map(async (symbol) => {
            const quote = await this.getQuoteDeduped(symbol);
            this.quoteCache.set(symbol, { data: quote, ts: Date.now() });
            return { ...quote, symbol };
          }),
        );

        for (const r of settled) {
          if (r.status === "fulfilled") {
            results.push(r.value);
          }
        }
      }
    }

    return results;
  }

  // ── Company ────────────────────────────────────────────────────────────

  async getCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile> {
    return this.fetch<FinnhubCompanyProfile>("/stock/profile2", { symbol });
  }

  async getCompanyNews(
    symbol: string,
    from: string,
    to: string,
  ): Promise<FinnhubNewsItem[]> {
    return this.fetch<FinnhubNewsItem[]>("/company-news", { symbol, from, to });
  }

  async getBasicFinancials(symbol: string): Promise<FinnhubFinancials> {
    return this.fetch<FinnhubFinancials>("/stock/metric", {
      symbol,
      metric: "all",
    });
  }

  async getPeers(symbol: string): Promise<string[]> {
    return this.fetch<string[]>("/stock/peers", { symbol });
  }

  // ── Market ─────────────────────────────────────────────────────────────

  async getMarketNews(category: string = "general"): Promise<FinnhubNewsItem[]> {
    return this.fetch<FinnhubNewsItem[]>("/news", { category });
  }

  async getMarketStatus(): Promise<FinnhubMarketStatus> {
    return this.fetch<FinnhubMarketStatus>("/stock/market-status", {
      exchange: "US",
    });
  }

  // ── Earnings ───────────────────────────────────────────────────────────

  async getEarningsCalendar(
    from: string,
    to: string,
  ): Promise<FinnhubEarningsCalendar> {
    return this.fetch<FinnhubEarningsCalendar>("/calendar/earnings", {
      from,
      to,
    });
  }

  // ── Analyst ────────────────────────────────────────────────────────────

  async getPriceTarget(symbol: string): Promise<FinnhubPriceTarget> {
    return this.fetch<FinnhubPriceTarget>("/stock/price-target", { symbol });
  }

  async getRecommendations(symbol: string): Promise<FinnhubRecommendation[]> {
    return this.fetch<FinnhubRecommendation[]>("/stock/recommendation", {
      symbol,
    });
  }

  // ── Sentiment ──────────────────────────────────────────────────────────

  async getSocialSentiment(symbol: string): Promise<FinnhubSocialSentiment> {
    return this.fetch<FinnhubSocialSentiment>("/stock/social-sentiment", {
      symbol,
    });
  }

  async getInsiderTransactions(
    symbol: string,
  ): Promise<FinnhubInsiderTransaction[]> {
    const res = await this.fetch<FinnhubInsiderTransactionsResponse>(
      "/stock/insider-transactions",
      { symbol },
    );
    return res.data;
  }
}

// ─── Singleton (server-side only) ────────────────────────────────────────────

export const finnhub = new FinnhubService(process.env.FINNHUB_API_KEY || "");
