"use client";

import { useCallback, useState } from "react";
import { useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { watchlistsAtom, activeWatchlistAtom } from "@/components/bloomberg/atoms";

// ─── Quote Hooks ────────────────────────────────────────────────────────

export function useQuotes(symbols: string[]) {
  return useQuery({
    queryKey: ["quotes", symbols.join(",")],
    queryFn: async () => {
      const res = await fetch(`/api/finnhub/quotes?symbols=${symbols.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
    refetchInterval: 15_000, // 15s polling
    staleTime: 10_000,
    enabled: symbols.length > 0,
  });
}

export function useMarketNews() {
  return useQuery({
    queryKey: ["market-news"],
    queryFn: async () => {
      const res = await fetch("/api/finnhub/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    refetchInterval: 120_000, // 2min
    staleTime: 60_000,
  });
}

export function useCompanyNews(symbol: string) {
  return useQuery({
    queryKey: ["company-news", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/finnhub/news?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch company news");
      return res.json();
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
    enabled: !!symbol,
  });
}

export function useEarnings() {
  return useQuery({
    queryKey: ["earnings"],
    queryFn: async () => {
      const res = await fetch("/api/finnhub/earnings");
      if (!res.ok) throw new Error("Failed to fetch earnings");
      return res.json();
    },
    refetchInterval: 3600_000, // 1hr
    staleTime: 1800_000,
  });
}

export function useMarketStatus() {
  return useQuery({
    queryKey: ["market-status"],
    queryFn: async () => {
      const res = await fetch("/api/finnhub/market-status");
      if (!res.ok) throw new Error("Failed to fetch market status");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useSentiment(symbol: string) {
  return useQuery({
    queryKey: ["sentiment", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/finnhub/sentiment?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch sentiment");
      return res.json();
    },
    refetchInterval: 900_000, // 15min
    staleTime: 600_000,
    enabled: !!symbol,
  });
}

export function useCompanyProfile(symbol: string) {
  return useQuery({
    queryKey: ["profile", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/finnhub/profile?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 86400_000, // 24hr
    enabled: !!symbol,
  });
}

export function useCompanyDescription(symbol: string) {
  return useQuery({
    queryKey: ["company-description", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/fmp/profile?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch company description");
      const data = await res.json();
      return (data.description || "") as string;
    },
    staleTime: 86400_000, // 24hr
    enabled: !!symbol,
    retry: 1,
  });
}

// ─── AI Research Hooks ──────────────────────────────────────────────────

import type { AIResearchBrief } from "@/components/bloomberg/types";

export function useAIResearch(symbol: string) {
  return useQuery({
    queryKey: ["ai-research", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/research/brief?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to generate research brief");
      return res.json() as Promise<AIResearchBrief>;
    },
    staleTime: 900_000, // 15min — research doesn't go stale instantly
    gcTime: 3600_000, // Keep in cache for 1hr
    enabled: !!symbol,
    retry: 1,
    refetchOnWindowFocus: false, // Don't auto-refetch, user triggers via Regenerate
  });
}

// ─── Watchlist Hooks ────────────────────────────────────────────────────

export function useImportWatchlists() {
  const setWatchlists = useSetAtom(watchlistsAtom);
  const setActiveWatchlist = useSetAtom(activeWatchlistAtom);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importWatchlists = useCallback(async () => {
    setIsImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/watchlists/import");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Import failed (${res.status})`);
      }

      const data = await res.json();
      const wl = data.watchlists as Record<string, string[]>;

      if (!wl || Object.keys(wl).length === 0) {
        throw new Error("No watchlists found in mirbot");
      }

      setWatchlists(wl);

      // If current active watchlist doesn't exist in new data, switch to first
      const names = Object.keys(wl);
      if (names.length > 0) {
        // Keep "Main" or "Swing" as default if it exists
        if (wl["Main"]) {
          setActiveWatchlist("Main");
        } else {
          setActiveWatchlist(names[0]);
        }
      }

      return { count: Object.keys(wl).length, names: Object.keys(wl) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      throw err;
    } finally {
      setIsImporting(false);
    }
  }, [setWatchlists, setActiveWatchlist]);

  return { importWatchlists, isImporting, error };
}

// ─── FMP Hooks ──────────────────────────────────────────────────────────

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async () => {
      const res = await fetch("/api/fmp/sectors");
      if (!res.ok) throw new Error("Failed to fetch sectors");
      return res.json();
    },
    refetchInterval: 300_000, // 5min
    staleTime: 120_000,
    retry: false, // FMP free tier may not support this endpoint
  });
}

export function useMovers(type: "gainers" | "losers") {
  return useQuery({
    queryKey: ["movers", type],
    queryFn: async () => {
      const res = await fetch(`/api/fmp/movers?type=${type}`);
      if (!res.ok) throw new Error("Failed to fetch movers");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false, // FMP free tier may not support this endpoint
  });
}

export function useFinancials(symbol: string) {
  return useQuery({
    queryKey: ["financials", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/fmp/financials?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch financials");
      return res.json();
    },
    staleTime: 3600_000,
    enabled: !!symbol,
    retry: 1, // FMP free tier has limit restrictions
  });
}

export function useBalanceSheet(symbol: string) {
  return useQuery({
    queryKey: ["balance-sheet", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/fmp/balance-sheet?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch balance sheet");
      return res.json();
    },
    staleTime: 3600_000,
    enabled: !!symbol,
    retry: 1,
  });
}

export function useCashFlow(symbol: string) {
  return useQuery({
    queryKey: ["cash-flow", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/fmp/cash-flow?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch cash flow");
      return res.json();
    },
    staleTime: 3600_000,
    enabled: !!symbol,
    retry: 1,
  });
}

// ─── Tradier Hooks ──────────────────────────────────────────────────────

export function useOptionsExpirations(symbol: string) {
  return useQuery({
    queryKey: ["options-expirations", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/tradier/options/expirations?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch expirations");
      const data = await res.json();
      return data.expirations as string[];
    },
    staleTime: 3600_000, // 1hr – expirations don't change often
    enabled: !!symbol,
    retry: 1,
  });
}

export function useOptionsChain(symbol: string, expiration: string) {
  return useQuery({
    queryKey: ["options-chain", symbol, expiration],
    queryFn: async () => {
      const res = await fetch(
        `/api/tradier/options/chain?symbol=${symbol}&expiration=${expiration}`
      );
      if (!res.ok) throw new Error("Failed to fetch options chain");
      const data = await res.json();
      return data.options as Array<{
        symbol: string;
        option_type: string;
        strike: number;
        last: number | null;
        bid: number;
        ask: number;
        volume: number;
        open_interest: number;
        greeks?: {
          delta: number;
          gamma: number;
          theta: number;
          vega: number;
          rho: number;
          mid_iv: number;
          smv_vol: number;
        };
      }>;
    },
    refetchInterval: 30_000, // 30s during market hours
    staleTime: 15_000,
    enabled: !!symbol && !!expiration,
    retry: 1,
  });
}

export function useTradierQuote(symbol: string) {
  return useQuery({
    queryKey: ["tradier-quote", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/tradier/quote?symbol=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch Tradier quote");
      return res.json() as Promise<{
        symbol: string;
        last: number;
        bid: number;
        ask: number;
        change: number;
        change_percentage: number;
        volume: number;
        prevclose: number;
      }>;
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled: !!symbol,
  });
}

// ─── E*TRADE Hooks ──────────────────────────────────────────────────────

export function useETradeAccounts() {
  return useQuery({
    queryKey: ["etrade-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/etrade/accounts");
      if (!res.ok) throw new Error("Failed to fetch E*TRADE accounts");
      return res.json();
    },
    staleTime: 300_000, // 5min
    retry: false,
  });
}

export function useETradePositions(accountId: string) {
  return useQuery({
    queryKey: ["etrade-positions", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/etrade/positions?accountId=${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch positions");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
    enabled: !!accountId,
    retry: false,
  });
}

export function useETradeBalance(accountId: string) {
  return useQuery({
    queryKey: ["etrade-balance", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/etrade/balance?accountId=${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
    enabled: !!accountId,
    retry: false,
  });
}
