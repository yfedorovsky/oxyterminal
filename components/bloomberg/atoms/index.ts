import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { LinkColor, PanelConfig, PanelType } from "../types";

const DEFAULT_PANELS: PanelConfig[] = [
  { id: "panel-quote-monitor", type: "quote-monitor", title: "Quote Monitor", linkColor: null, isMaximized: false },
  { id: "panel-main-chart", type: "main-chart", title: "Chart", linkColor: null, isMaximized: false },
  { id: "panel-news-feed", type: "news-feed", title: "News", linkColor: null, isMaximized: false },
  { id: "panel-sentiment-gauges", type: "sentiment-gauges", title: "Sentiment", linkColor: null, isMaximized: false },
  { id: "panel-sector-leaders", type: "sector-leaders", title: "Sectors", linkColor: null, isMaximized: false },
  { id: "panel-ai-research", type: "ai-research", title: "AI Research", linkColor: null, isMaximized: false },
  { id: "panel-options-chain", type: "options-chain", title: "Options", linkColor: null, isMaximized: false },
  { id: "panel-earnings-calendar", type: "earnings-calendar", title: "Earnings", linkColor: null, isMaximized: false },
  { id: "panel-quick-stats", type: "quick-stats", title: "Quick Stats", linkColor: null, isMaximized: false },
  { id: "panel-portfolio", type: "portfolio", title: "Portfolio", linkColor: null, isMaximized: false },
];

export const activeTickerAtom = atom<string>("NVDA");
export const commandBarOpenAtom = atom<boolean>(false);
export const commandHistoryAtom = atom<string[]>([]);
export const activeCommandAtom = atom<string>("");
export const panelsAtom = atom<PanelConfig[]>(DEFAULT_PANELS);
export const maximizedPanelAtom = atom<string | null>(null);
export const activeLinkColorAtom = atom<LinkColor>(null);
export const activeWatchlistAtom = atomWithStorage<string>("oxy-active-watchlist", "Main");
export const watchlistsAtom = atomWithStorage<Record<string, string[]>>("oxy-watchlists", {
  Main: [
    "AAPL", "AMZN", "AMGN", "BAC", "BRK.B",
    "GOOG", "IBM", "JNJ", "JPM", "MA",
    "META", "MSFT", "MU", "NVDA", "PFE",
    "SPY", "QQQ", "TSLA",
  ],
});
export const showHelpAtom = atom<boolean>(false);

// Tracks which panel to show in the "flexible" bottom-left slot (grid area "oc").
// Default is "options-chain", but commands like DES, FA, MOST swap it.
export const flexPanelAtom = atomWithStorage<PanelType>("oxy-flex-panel", "options-chain");
