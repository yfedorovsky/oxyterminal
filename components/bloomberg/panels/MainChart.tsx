"use client";

import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { activeTickerAtom } from "../atoms";

const WIDGET_SCRIPT_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

export default function MainChart() {
  const activeTicker = useAtomValue(activeTickerAtom);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wrapper = widgetRef.current;
    if (!wrapper) return;

    // Clear any previous widget content
    wrapper.innerHTML = "";
    setLoading(true);

    // Build the TradingView widget container structure
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.width = "100%";
    widgetContainer.style.height = "100%";

    const chartDiv = document.createElement("div");
    chartDiv.id = "tradingview-chart";
    chartDiv.style.width = "100%";
    chartDiv.style.height = "100%";
    widgetContainer.appendChild(chartDiv);

    // Create the widget script with embedded JSON configuration
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: `NASDAQ:${activeTicker}`,
      theme: "dark",
      backgroundColor: "#0a0e14",
      style: "1",
      timezone: "America/New_York",
      toolbar_bg: "#0a0e14",
      hide_side_toolbar: false,
      allow_symbol_change: false,
      save_image: false,
      studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
      interval: "D",
      width: "100%",
      height: "100%",
      container_id: "tradingview-chart",
    });

    script.onload = () => {
      setLoading(false);
    };

    // Fallback: hide loader after a few seconds in case onload does not fire
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    widgetContainer.appendChild(script);
    wrapper.appendChild(widgetContainer);

    return () => {
      clearTimeout(fallbackTimer);
      // Clean up: remove all widget DOM nodes
      wrapper.innerHTML = "";
    };
  }, [activeTicker]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#0a0e14",
      }}
    >
      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            background: "#0a0e14",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              color: "#3a4553",
              fontFamily: "monospace",
              letterSpacing: "1px",
            }}
          >
            Loading {activeTicker}...
          </span>
        </div>
      )}

      {/* Widget mount point -- managed imperatively via useEffect */}
      <div
        ref={widgetRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
