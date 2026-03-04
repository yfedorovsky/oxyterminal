"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { activeTickerAtom } from "../atoms";

const BAR_COUNT = 20;

export default function MainChart() {
  const activeTicker = useAtomValue(activeTickerAtom);

  const bars = useMemo(() => {
    // Deterministic pseudo-random bars based on ticker string
    const seed = activeTicker
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const hash = ((seed * (i + 1) * 7 + 13) % 100) / 100;
      const height = 15 + hash * 85; // 15-100% height range
      const isGreen = ((seed + i) % 3) !== 0;
      return { height, isGreen };
    });
  }, [activeTicker]);

  return (
    <div
      className="flex h-full flex-col items-center justify-center"
      style={{ background: "#0d1117" }}
    >
      {/* Ticker label */}
      <div
        style={{
          fontSize: "32px",
          fontWeight: 600,
          color: "#7a8a9e",
          letterSpacing: "2px",
          marginBottom: "4px",
        }}
      >
        {activeTicker}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "#7a8a9e",
          marginBottom: "24px",
        }}
      >
        TradingView chart loads in Phase 2
      </div>

      {/* Placeholder volume bars */}
      <div
        className="flex items-end gap-0.5"
        style={{ height: "80px", width: "260px" }}
      >
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${bar.height}%`,
              background: bar.isGreen
                ? "rgba(0, 212, 170, 0.3)"
                : "rgba(255, 71, 87, 0.3)",
              minWidth: "4px",
            }}
          />
        ))}
      </div>
    </div>
  );
}
