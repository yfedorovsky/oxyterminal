"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { activeTickerAtom } from "../atoms";

export default function MainChart() {
  const activeTicker = useAtomValue(activeTickerAtom);

  // Build the TradingView embed URL with config as a hash fragment.
  // This is the same iframe URL that TradingView's embed script creates
  // under the hood, but done directly to avoid cross-origin script issues.
  const iframeSrc = useMemo(() => {
    const config = {
      symbol: `NASDAQ:${activeTicker}`,
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
