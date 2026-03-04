"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { activeTickerAtom } from "../atoms";

// NYSE-listed tickers from the watchlist. TradingView needs the correct
// exchange prefix — everything else defaults to NASDAQ.
const NYSE_TICKERS = new Set([
  "BAC", "BRK.B", "IBM", "JNJ", "JPM", "MA", "PFE",
  "GS", "UNH", "JNJ", "XOM", "CVX", "MCD", "KO", "PG",
  "WMT", "DIS", "V", "HD", "CAT", "HON", "GE", "MMM",
  "CRM", // NYSE since Dec 2020
]);

// ETFs use AMEX
const AMEX_TICKERS = new Set(["SPY", "QQQ", "DIA", "IWM", "TLT", "XLE", "KRE", "GLD", "SLV"]);

function getTradingViewSymbol(ticker: string): string {
  if (AMEX_TICKERS.has(ticker)) return `AMEX:${ticker}`;
  if (NYSE_TICKERS.has(ticker)) return `NYSE:${ticker}`;
  return `NASDAQ:${ticker}`;
}

export default function MainChart() {
  const activeTicker = useAtomValue(activeTickerAtom);

  // Build the TradingView embed URL with config as a hash fragment.
  // This is the same iframe URL that TradingView's embed script creates
  // under the hood, but done directly to avoid cross-origin script issues.
  const iframeSrc = useMemo(() => {
    const config = {
      symbol: getTradingViewSymbol(activeTicker),
      theme: "dark",
      backgroundColor: "rgba(10, 14, 20, 1)",
      style: "1",
      timezone: "America/New_York",
      toolbar_bg: "#0a0e14",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
      interval: "D",
      locale: "en",
      width: "100%",
      height: "100%",
    };
    return `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#${encodeURIComponent(JSON.stringify(config))}`;
  }, [activeTicker]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0e14",
      }}
    >
      <iframe
        key={activeTicker}
        src={iframeSrc}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="lazy"
        title={`TradingView chart for ${activeTicker}`}
      />
    </div>
  );
}
