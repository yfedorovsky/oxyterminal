"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useQuotes } from "@/lib/hooks";
import { useFinnhubWebSocket } from "@/lib/use-websocket-quotes";
import { watchlistQuotes as mockQuotes } from "@/lib/mock-data";
import type { WatchlistQuote } from "../types";
import {
  activeTickerAtom,
  watchlistsAtom,
  activeWatchlistAtom,
} from "../atoms";

type SortKey = keyof Pick<
  WatchlistQuote,
  "ticker" | "last" | "change" | "changePct" | "bid" | "ask" | "volume"
>;

type SortDir = "asc" | "desc";

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(1) + "B";
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toString();
}

function formatChange(val: number): string {
  const prefix = val > 0 ? "+" : "";
  return prefix + val.toFixed(2);
}

function formatChangePct(val: number): string {
  const prefix = val > 0 ? "+" : "";
  return prefix + val.toFixed(2) + "%";
}

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "ticker", label: "Ticker", align: "left" },
  { key: "last", label: "Last", align: "right" },
  { key: "change", label: "Chg", align: "right" },
  { key: "changePct", label: "Chg%", align: "right" },
  { key: "bid", label: "Bid", align: "right" },
  { key: "ask", label: "Ask", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
];

// Build a lookup from mock data for fields the API doesn't provide
const mockLookup = new Map(mockQuotes.map((q) => [q.ticker, q]));

// ─── Price flash hook ───────────────────────────────────────────────────────
// Tracks which tickers have just received a price update from the WebSocket
// and whether the price moved up or down. Returns a Map of ticker -> "up" | "down"
// that clears itself after a brief animation window.

function usePriceFlash(
  trades: Map<string, { price: number; timestamp: number; volume: number }>,
) {
  const [flashes, setFlashes] = useState<Map<string, "up" | "down">>(
    new Map(),
  );
  const prevPricesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const newFlashes = new Map<string, "up" | "down">();
    let hasChanges = false;

    for (const [symbol, trade] of trades) {
      const prevPrice = prevPricesRef.current.get(symbol);
      if (prevPrice !== undefined && prevPrice !== trade.price) {
        newFlashes.set(symbol, trade.price > prevPrice ? "up" : "down");
        hasChanges = true;
      }
      prevPricesRef.current.set(symbol, trade.price);
    }

    if (hasChanges) {
      setFlashes(newFlashes);

      // Clear flash after animation duration
      const timer = setTimeout(() => {
        setFlashes(new Map());
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [trades]);

  return flashes;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function QuoteMonitor() {
  const [activeTicker, setActiveTicker] = useAtom(activeTickerAtom);
  const watchlists = useAtomValue(watchlistsAtom);
  const [activeWatchlist, setActiveWatchlist] = useAtom(activeWatchlistAtom);

  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const tickers = useMemo(() => {
    return watchlists[activeWatchlist] ?? [];
  }, [watchlists, activeWatchlist]);

  // REST polling baseline
  const { data: apiQuotes, isLoading, isError } = useQuotes(tickers);

  // WebSocket real-time overlay (only activates if NEXT_PUBLIC_FINNHUB_WS_KEY is set)
  const { trades, isConnected, isAvailable } = useFinnhubWebSocket(tickers);

  // Price flash animations
  const flashes = usePriceFlash(trades);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  const tickerSet = useMemo(() => {
    return new Set(tickers);
  }, [tickers]);

  // Map API data to WatchlistQuote shape, falling back to mock for missing fields
  const quotes: WatchlistQuote[] = useMemo(() => {
    // If API data is available, map it
    if (apiQuotes && Array.isArray(apiQuotes) && apiQuotes.length > 0) {
      return apiQuotes
        .filter((q: { symbol: string }) => tickerSet.has(q.symbol))
        .map(
          (q: {
            symbol: string;
            price: number;
            change: number;
            changePercent: number;
            high: number;
            low: number;
            open: number;
            prevClose: number;
          }) => {
            const mock = mockLookup.get(q.symbol);

            // If WebSocket has a more recent price for this symbol, use it
            const wsTrade = trades.get(q.symbol);
            const last = wsTrade ? wsTrade.price : q.price;
            const change = wsTrade ? last - q.prevClose : q.change;
            const changePct =
              wsTrade && q.prevClose !== 0
                ? (change / q.prevClose) * 100
                : q.changePercent;

            return {
              ticker: q.symbol,
              name: mock?.name ?? q.symbol,
              last,
              prevClose: q.prevClose,
              bid: last - 0.02,
              ask: last + 0.02,
              change,
              changePct,
              volume: mock?.volume ?? 0,
              high: q.high,
              low: q.low,
              open: q.open,
              high52w: mock?.high52w ?? 0,
              low52w: mock?.low52w ?? 0,
              marketCap: mock?.marketCap ?? 0,
              pe: mock?.pe ?? 0,
              sector: mock?.sector ?? "",
            };
          },
        );
    }

    // Fallback to mock data (also merge WS prices if available)
    return mockQuotes
      .filter((q) => tickerSet.has(q.ticker))
      .map((q) => {
        const wsTrade = trades.get(q.ticker);
        if (!wsTrade) return q;

        const last = wsTrade.price;
        const change = last - q.prevClose;
        const changePct =
          q.prevClose !== 0 ? (change / q.prevClose) * 100 : q.changePct;

        return {
          ...q,
          last,
          change,
          changePct,
          bid: last - 0.02,
          ask: last + 0.02,
        };
      });
  }, [apiQuotes, tickerSet, trades]);

  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = aVal as number;
      const bNum = bVal as number;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [quotes, sortKey, sortDir]);

  const watchlistNames = useMemo(() => Object.keys(watchlists), [watchlists]);
  const hasMultipleWatchlists = watchlistNames.length > 1;

  if (isLoading && quotes.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ background: "#0a0e14", color: "#3a4553", fontSize: "11px" }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#0a0e14" }}>
      {/* Price flash animation styles */}
      <style>{`
        @keyframes price-flash-up {
          0% { background-color: rgba(0, 212, 170, 0.35); }
          100% { background-color: transparent; }
        }
        @keyframes price-flash-down {
          0% { background-color: rgba(255, 71, 87, 0.35); }
          100% { background-color: transparent; }
        }
        .price-flash-up {
          animation: price-flash-up 0.6s ease-out;
        }
        .price-flash-down {
          animation: price-flash-down 0.6s ease-out;
        }
      `}</style>

      {/* Watchlist tab bar */}
      {hasMultipleWatchlists && (
        <div
          className="flex items-center gap-0 shrink-0 overflow-x-auto terminal-scrollbar"
          style={{
            background: "#111820",
            borderBottom: "1px solid #2a3545",
            minHeight: "26px",
          }}
        >
          {watchlistNames.map((name) => {
            const isActive = name === activeWatchlist;
            const count = watchlists[name]?.length ?? 0;
            return (
              <button
                key={name}
                onClick={() => setActiveWatchlist(name)}
                className="px-3 py-1 shrink-0 cursor-pointer select-none transition-colors"
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "#ff8c00" : "#7a8a9e",
                  background: isActive ? "#1a2130" : "transparent",
                  borderBottom: isActive
                    ? "2px solid #ff8c00"
                    : "2px solid transparent",
                  letterSpacing: "0.03em",
                }}
              >
                {name}
                <span
                  style={{
                    marginLeft: "4px",
                    fontSize: "9px",
                    color: isActive ? "#ff8c00" : "#3a4553",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-auto">
      <table
        className="w-full border-collapse text-xs"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="sticky top-0 z-10 cursor-pointer select-none px-2 py-1 font-normal uppercase tracking-wide"
                style={{
                  fontSize: "10px",
                  color: "#7a8a9e",
                  background: "#111820",
                  textAlign: col.align,
                  borderBottom: "1px solid #2a3545",
                }}
              >
                <span
                  className="flex items-center gap-1"
                  style={{
                    justifyContent:
                      col.align === "right" ? "flex-end" : "flex-start",
                  }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span>{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                  )}
                  {col.key === "ticker" && isLoading && (
                    <span
                      className="inline-block animate-pulse"
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#ff8c00",
                        marginLeft: "4px",
                      }}
                    />
                  )}
                  {/* WebSocket LIVE indicator next to Ticker column header */}
                  {col.key === "ticker" && isAvailable && isConnected && (
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 700,
                        color: "#00d4aa",
                        background: "rgba(0, 212, 170, 0.15)",
                        border: "1px solid rgba(0, 212, 170, 0.3)",
                        borderRadius: "3px",
                        padding: "0px 3px",
                        marginLeft: "4px",
                        letterSpacing: "0.5px",
                        lineHeight: "14px",
                      }}
                    >
                      LIVE
                    </span>
                  )}
                  {col.key === "ticker" && isAvailable && !isConnected && (
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 700,
                        color: "#ff8c00",
                        background: "rgba(255, 140, 0, 0.15)",
                        border: "1px solid rgba(255, 140, 0, 0.3)",
                        borderRadius: "3px",
                        padding: "0px 3px",
                        marginLeft: "4px",
                        letterSpacing: "0.5px",
                        lineHeight: "14px",
                      }}
                    >
                      WS
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedQuotes.map((quote, idx) => {
            const isActive = quote.ticker === activeTicker;
            const isEven = idx % 2 === 0;
            const rowBg = isActive
              ? "#1e2838"
              : isEven
                ? "#111820"
                : "#151d2a";
            const changeColor = quote.change >= 0 ? "#00d4aa" : "#ff4757";
            const flash = flashes.get(quote.ticker);

            return (
              <tr
                key={quote.ticker}
                onClick={() => setActiveTicker(quote.ticker)}
                className={`cursor-pointer transition-colors hover:brightness-110 ${
                  flash === "up"
                    ? "price-flash-up"
                    : flash === "down"
                      ? "price-flash-down"
                      : ""
                }`}
                style={{
                  background: rowBg,
                  height: "24px",
                  borderLeft: isActive
                    ? "2px solid #ff8c00"
                    : "2px solid transparent",
                }}
              >
                <td
                  className="px-2 py-0.5"
                  style={{
                    color: "#e8edf3",
                    fontWeight: 600,
                    textAlign: "left",
                  }}
                >
                  {quote.ticker}
                </td>
                <td
                  className="px-2 py-0.5"
                  style={{ color: "#e8edf3", textAlign: "right" }}
                >
                  {quote.last.toFixed(2)}
                </td>
                <td
                  className="px-2 py-0.5"
                  style={{ color: changeColor, textAlign: "right" }}
                >
                  {formatChange(quote.change)}
                </td>
                <td
                  className="px-2 py-0.5"
                  style={{ color: changeColor, textAlign: "right" }}
                >
                  {formatChangePct(quote.changePct)}
                </td>
                <td
                  className="px-2 py-0.5"
                  style={{ color: "#e8edf3", textAlign: "right" }}
                >
                  {quote.bid.toFixed(2)}
                </td>
                <td
                  className="px-2 py-0.5"
                  style={{ color: "#e8edf3", textAlign: "right" }}
                >
                  {quote.ask.toFixed(2)}
                </td>
                <td
                  className="px-2 py-0.5"
                  style={{ color: "#7a8a9e", textAlign: "right" }}
                >
                  {formatVolume(quote.volume)}
                </td>
              </tr>
            );
          })}
          {isError && (
            <tr>
              <td
                colSpan={7}
                className="px-2 py-1 text-center"
                style={{ color: "#ff4757", fontSize: "10px" }}
              >
                API error - showing cached data
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
