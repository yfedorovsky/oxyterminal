"use client";

import { useQuery } from "@tanstack/react-query";

// ─── Finnhub Hooks ──────────────────────────────────────────────────────

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
