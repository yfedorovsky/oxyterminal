// -----------------------------------------------------------------------------
// FMP (Financial Modeling Prep) API Service Layer — Stable Endpoint
// Server-side only — do not import in client components.
// -----------------------------------------------------------------------------

// ─── Response Types ──────────────────────────────────────────────────────────

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string | null;
  sharesOutstanding: number;
  timestamp: number;
}

export interface FMPProfile {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  exchangeShortName: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  cik: string;
  isin: string;
  cusip: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isFund: boolean;
  isAdr: boolean;
}

export interface FMPSectorPerformance {
  sector: string;
  changesPercentage: string;
}

export interface FMPGainerLoser {
  symbol: string;
  name: string;
  change: number;
  price: number;
  changesPercentage: number;
}

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear?: string;
  fiscalYear?: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  link: string;
  finalLink: string;
}

// ─── Service Class ───────────────────────────────────────────────────────────

export class FMPService {
  private apiKey: string;
  private baseUrl = "https://financialmodelingprep.com/stable";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generic fetch helper. Builds the full URL with apikey auth and optional
   * query parameters, then returns the parsed JSON body.
   */
  private async fetch<T>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set("apikey", this.apiKey);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString());

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `FMP API error ${res.status} for ${endpoint}: ${body}`,
      );
    }

    return res.json() as Promise<T>;
  }

  // ── Stock Quotes ───────────────────────────────────────────────────────

  async getQuote(symbol: string): Promise<FMPQuote[]> {
    return this.fetch<FMPQuote[]>("/quote", { symbol });
  }

  // ── Company Profile ────────────────────────────────────────────────────

  async getProfile(symbol: string): Promise<FMPProfile[]> {
    return this.fetch<FMPProfile[]>("/profile", { symbol });
  }

  // ── Market ─────────────────────────────────────────────────────────────

  async getSectorPerformance(): Promise<FMPSectorPerformance[]> {
    try {
      return await this.fetch<FMPSectorPerformance[]>("/sector-performance");
    } catch {
      // Free tier may not support this endpoint — return empty array
      return [];
    }
  }

  async getGainers(): Promise<FMPGainerLoser[]> {
    try {
      return await this.fetch<FMPGainerLoser[]>("/stock_market/gainers");
    } catch {
      // Free tier may not support this endpoint
      return [];
    }
  }

  async getLosers(): Promise<FMPGainerLoser[]> {
    try {
      return await this.fetch<FMPGainerLoser[]>("/stock_market/losers");
    } catch {
      // Free tier may not support this endpoint
      return [];
    }
  }

  // ── Financials ─────────────────────────────────────────────────────────

  async getIncomeStatement(
    symbol: string,
    period: string = "quarter",
    limit: number = 8,
  ): Promise<FMPIncomeStatement[]> {
    return this.fetch<FMPIncomeStatement[]>("/income-statement", {
      symbol,
      period,
      limit: String(limit),
    });
  }
}

// ─── Singleton (server-side only) ────────────────────────────────────────────

export const fmp = new FMPService(process.env.FMP_API_KEY || "");
