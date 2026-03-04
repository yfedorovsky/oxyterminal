"use client";

import { useMemo, useState, useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import { watchlistQuotes } from "@/lib/mock-data";
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

export default function QuoteMonitor() {
  const [activeTicker, setActiveTicker] = useAtom(activeTickerAtom);
  const watchlists = useAtomValue(watchlistsAtom);
  const activeWatchlist = useAtomValue(activeWatchlistAtom);

  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const tickerSet = useMemo(() => {
    const tickers = watchlists[activeWatchlist] ?? [];
    return new Set(tickers);
  }, [watchlists, activeWatchlist]);

  const sortedQuotes = useMemo(() => {
    const filtered = watchlistQuotes.filter((q) => tickerSet.has(q.ticker));
    return filtered.sort((a, b) => {
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
  }, [tickerSet, sortKey, sortDir]);

  return (
    <div className="h-full overflow-auto" style={{ background: "#0a0e14" }}>
      <table className="w-full border-collapse text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
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
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                )}
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

            return (
              <tr
                key={quote.ticker}
                onClick={() => setActiveTicker(quote.ticker)}
                className="cursor-pointer transition-colors hover:brightness-110"
                style={{
                  background: rowBg,
                  height: "24px",
                  borderLeft: isActive ? "2px solid #ff8c00" : "2px solid transparent",
                }}
              >
                <td
                  className="px-2 py-0.5"
                  style={{ color: "#e8edf3", fontWeight: 600, textAlign: "left" }}
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
        </tbody>
      </table>
    </div>
  );
}
