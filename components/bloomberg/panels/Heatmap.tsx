"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import {
  activeTickerAtom,
  watchlistsAtom,
  activeWatchlistAtom,
} from "../atoms";
import { useQuotes } from "@/lib/hooks";

// ─── Treemap layout (squarified) ────────────────────────────────────────────

interface TreemapRect {
  ticker: string;
  changePct: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Simple slice-and-dice treemap layout
function computeTreemap(
  items: { ticker: string; weight: number; changePct: number }[],
  x: number,
  y: number,
  w: number,
  h: number
): TreemapRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{ ticker: items[0].ticker, changePct: items[0].changePct, x, y, w, h }];
  }

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  if (totalWeight <= 0) {
    // Equal split fallback
    const cols = Math.ceil(Math.sqrt(items.length));
    const rows = Math.ceil(items.length / cols);
    const cellW = w / cols;
    const cellH = h / rows;
    return items.map((item, idx) => ({
      ticker: item.ticker,
      changePct: item.changePct,
      x: x + (idx % cols) * cellW,
      y: y + Math.floor(idx / cols) * cellH,
      w: cellW,
      h: cellH,
    }));
  }

  // Split into two halves by weight
  const sorted = [...items].sort((a, b) => b.weight - a.weight);
  let halfWeight = 0;
  let splitIdx = 0;
  const targetHalf = totalWeight / 2;
  for (let i = 0; i < sorted.length; i++) {
    halfWeight += sorted[i].weight;
    splitIdx = i + 1;
    if (halfWeight >= targetHalf) break;
  }

  // Avoid degenerate splits
  if (splitIdx === 0) splitIdx = 1;
  if (splitIdx >= sorted.length) splitIdx = sorted.length - 1;

  const left = sorted.slice(0, splitIdx);
  const right = sorted.slice(splitIdx);
  const leftWeight = left.reduce((s, i) => s + i.weight, 0);
  const ratio = leftWeight / totalWeight;

  if (w >= h) {
    // Split horizontally
    const leftW = w * ratio;
    return [
      ...computeTreemap(left, x, y, leftW, h),
      ...computeTreemap(right, x + leftW, y, w - leftW, h),
    ];
  } else {
    // Split vertically
    const topH = h * ratio;
    return [
      ...computeTreemap(left, x, y, w, topH),
      ...computeTreemap(right, x, y + topH, w, h - topH),
    ];
  }
}

// ─── Color helpers ──────────────────────────────────────────────────────────

function getHeatColor(changePct: number): string {
  const maxIntensity = 5; // +-5% = full saturation
  const clamped = Math.max(-maxIntensity, Math.min(maxIntensity, changePct));
  const ratio = Math.abs(clamped) / maxIntensity;

  if (changePct >= 0) {
    // Green range: from dark (#0d2818) to bright (#00d4aa)
    const r = Math.round(13 * (1 - ratio));
    const g = Math.round(40 + 172 * ratio);
    const b = Math.round(24 + 146 * ratio);
    return `rgb(${r},${g},${b})`;
  } else {
    // Red range: from dark (#2d1015) to bright (#ff4757)
    const r = Math.round(45 + 210 * ratio);
    const g = Math.round(16 + 55 * ratio * 0.3);
    const b = Math.round(21 + 66 * ratio * 0.5);
    return `rgb(${r},${g},${b})`;
  }
}

function getTextColor(changePct: number): string {
  const maxIntensity = 5;
  const ratio = Math.abs(Math.max(-maxIntensity, Math.min(maxIntensity, changePct))) / maxIntensity;
  return ratio > 0.3 ? "#ffffff" : "#c0c8d4";
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Heatmap() {
  const activeTicker = useAtomValue(activeTickerAtom);
  const watchlists = useAtomValue(watchlistsAtom);
  const activeWatchlist = useAtomValue(activeWatchlistAtom);

  const tickers = useMemo(
    () => watchlists[activeWatchlist] ?? [],
    [watchlists, activeWatchlist]
  );

  const { data: apiQuotes, isLoading } = useQuotes(tickers);

  // Build weighted items from quote data
  const items = useMemo(() => {
    if (!apiQuotes || !Array.isArray(apiQuotes) || apiQuotes.length === 0) {
      // Fallback: equal weight, 0% change
      return tickers.map((t) => ({ ticker: t, weight: 1, changePct: 0 }));
    }

    const quoteMap = new Map<
      string,
      { symbol: string; price: number; change: number; changePercent: number }
    >();
    for (const q of apiQuotes) {
      quoteMap.set(q.symbol, q);
    }

    return tickers.map((t) => {
      const q = quoteMap.get(t);
      return {
        ticker: t,
        weight: Math.max(1, Math.abs(q?.changePercent ?? 0) * 10 + 1),
        changePct: q?.changePercent ?? 0,
      };
    });
  }, [apiQuotes, tickers]);

  // Compute treemap layout (use fixed 100x100 virtual space, then use percentages)
  const rects = useMemo(
    () => computeTreemap(items, 0, 0, 100, 100),
    [items]
  );

  if (isLoading && rects.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ background: "#0a0e14", color: "#3a4553", fontSize: "11px" }}
      >
        Loading heatmap...
      </div>
    );
  }

  return (
    <div
      className="h-full w-full relative"
      style={{ background: "#0a0e14" }}
    >
      {/* Watchlist label */}
      <div
        className="absolute top-0 left-0 z-10 px-2 py-0.5"
        style={{
          fontSize: "9px",
          color: "#7a8a9e",
          background: "rgba(10, 14, 20, 0.8)",
        }}
      >
        {activeWatchlist} ({tickers.length})
      </div>

      <div className="h-full w-full relative" style={{ padding: "1px" }}>
        {rects.map((rect) => {
          const isActive = rect.ticker === activeTicker;
          const bgColor = getHeatColor(rect.changePct);
          const txtColor = getTextColor(rect.changePct);
          // Determine if cell is large enough for labels
          const showTicker = rect.w > 6 && rect.h > 5;
          const showPct = rect.w > 8 && rect.h > 8;

          return (
            <div
              key={rect.ticker}
              className="absolute flex flex-col items-center justify-center overflow-hidden select-none"
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.w}%`,
                height: `${rect.h}%`,
                background: bgColor,
                outline: isActive ? "2px solid #ff8c00" : "1px solid rgba(10, 14, 20, 0.6)",
                outlineOffset: isActive ? "-2px" : "-1px",
                zIndex: isActive ? 5 : 1,
                cursor: "default",
              }}
              title={`${rect.ticker}: ${rect.changePct >= 0 ? "+" : ""}${rect.changePct.toFixed(2)}%`}
            >
              {showTicker && (
                <span
                  style={{
                    fontSize: rect.w > 15 ? "11px" : "9px",
                    fontWeight: 700,
                    color: txtColor,
                    lineHeight: 1.1,
                    letterSpacing: "0.02em",
                  }}
                >
                  {rect.ticker}
                </span>
              )}
              {showPct && (
                <span
                  style={{
                    fontSize: rect.w > 15 ? "10px" : "8px",
                    fontWeight: 500,
                    color: txtColor,
                    opacity: 0.85,
                    lineHeight: 1.1,
                  }}
                >
                  {rect.changePct >= 0 ? "+" : ""}
                  {rect.changePct.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
