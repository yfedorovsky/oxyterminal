export type PanelType =
  | "quote-monitor"
  | "main-chart"
  | "news-feed"
  | "sentiment-gauges"
  | "ai-research"
  | "options-chain"
  | "financials"
  | "earnings-calendar"
  | "sector-leaders"
  | "quick-stats"
  | "most-active"
  | "description"
  | "heatmap"
  | "portfolio";

export type LinkColor = "green" | "blue" | "yellow" | "red" | null;

export interface PanelConfig {
  id: string;
  type: PanelType;
  title: string;
  linkColor: LinkColor;
  isMaximized: boolean;
}

export type CommandType =
  | "quote"
  | "chart"
  | "news"
  | "sentiment"
  | "research"
  | "options"
  | "financials"
  | "earnings"
  | "sectors"
  | "stats"
  | "movers"
  | "help"
  | "clear"
  | "layout"
  | "link"
  | "unlink"
  | "maximize"
  | "restore"
  | "description"
  | "watchlist"
  | "heatmap"
  | "alert"
  | "portfolio"
  | "unknown";

export interface Command {
  raw: string;
  type: CommandType;
  ticker?: string;
  args?: string[];
}

export interface WatchlistQuote {
  ticker: string;
  name: string;
  last: number;
  prevClose: number;
  bid: number;
  ask: number;
  change: number;
  changePct: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  high52w: number;
  low52w: number;
  marketCap: number;
  pe: number;
  sector: string;
}

export interface SentimentSubIndicator {
  label: string;
  value: number;
}

export interface SentimentData {
  fearGreedIndex: {
    value: number;
    reading: string;
  };
  subIndicators: {
    momentum: number;
    priceStrength: number;
    breadth: number;
    putCall: number;
    vix: number;
    junkBond: number;
    safeHaven: number;
  };
  aaiiBullBearSpread: number;
  bullPct: number;
  bearPct: number;
  neutralPct: number;
  vix: number;
  putCallRatio: number;
  bofaSSI: number;
  overallSignal: {
    signal: string;
    explanation: string;
  };
}

export interface NewsItem {
  headline: string;
  source: string;
  timestamp: string;
  relatedTickers: string[];
  url: string;
}

export interface EarningsItem {
  date: string;
  ticker: string;
  company: string;
  epsEstimate: number;
  revenueEstimate: number;
  time: "BMO" | "AMC";
}

export interface SectorLeader {
  ticker: string;
  changePct: number;
}

export interface SectorData {
  name: string;
  performance: number;
  leaders: SectorLeader[];
}

export interface ResearchKeyLevels {
  support: number;
  resistance: number;
  current: number;
  low52w: number;
  high52w: number;
}

export interface ResearchCatalyst {
  date: string;
  description: string;
}

export interface AIResearchBrief {
  ticker: string;
  summary: string;
  bullCase: string[];
  bearCase: string[];
  keyLevels: ResearchKeyLevels;
  catalysts: ResearchCatalyst[];
  verdict: string;
  confidence: number;
}

export interface OptionLeg {
  last: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  iv: number;
}

export interface OptionStrike {
  strike: number;
  calls: OptionLeg;
  puts: OptionLeg;
}

export interface OptionsChain {
  ticker: string;
  expiration: string;
  strikes: OptionStrike[];
}

export interface QuarterlyFinancial {
  quarter: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  revenueGrowth: number;
}

export interface FinancialsData {
  ticker: string;
  quarters: QuarterlyFinancial[];
}

export interface MoverStock {
  ticker: string;
  name: string;
  last: number;
  change: number;
  changePct: number;
  volume: number;
}

export interface TreasuryYield {
  maturity: string;
  value: number;
  change: number;
}

export interface QuickStats {
  advanceDeclineRatio: number;
  marketBreadth: number;
  treasuryYields: TreasuryYield[];
  nextMarketEvent: {
    name: string;
    date: string;
  };
}

export type MarketItem = {
  id: string;
  num?: string;
  rmi?: string;
  value: number;
  change: number;
  pctChange: number;
  avat: number;
  time: string;
  ytd: number;
  ytdCur: number;
  sparkline1?: number[];
  sparkline2?: number[];
  sparklineUpdated?: string;
  lastUpdated?: string;
  historicalData10D?: number[];
  volatility?: number;
  isMover?: boolean;
};

export type MarketData = {
  americas: MarketItem[];
  emea: MarketItem[];
  asiaPacific: MarketItem[];
  lastUpdated?: string;
  lastSparklineUpdate?: string;
  isFromRedis?: boolean;
  dataSource?: string;
  [key: string]: MarketItem[] | string | boolean | undefined;
};

export interface FilterState {
  showMovers: boolean;
  showVolatility: boolean;
  showRatios: boolean;
  showFutures: boolean;
  showAvat: boolean;
  show10D: boolean;
  showYTD: boolean;
  showCAD: boolean;
}
