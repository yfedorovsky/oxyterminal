"use client";

import { quickStats } from "@/lib/mock-data";
import { sentimentData } from "@/lib/mock-data";
import type { TreasuryYield } from "../types";

function getVixColor(vix: number): string {
  if (vix < 15) return "#00d4aa";
  if (vix <= 25) return "#ff8c00";
  return "#ff4757";
}

export default function QuickStats() {
  const stats = quickStats;
  const vix = sentimentData.vix;
  const vixColor = getVixColor(vix);

  const adRatio = stats.advanceDeclineRatio;
  const adBarWidth = Math.min((adRatio / (adRatio + 1)) * 100, 100);

  return (
    <div className="h-full overflow-auto p-3" style={{ background: "#0a0e14" }}>
      {/* VIX */}
      <div className="mb-3">
        <div
          className="uppercase tracking-wide"
          style={{ fontSize: "10px", color: "#ff8c00", marginBottom: "2px" }}
        >
          VIX
        </div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: vixColor,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1.1,
          }}
        >
          {vix.toFixed(1)}
        </div>
      </div>

      {/* Treasury Yields */}
      <div className="mb-3">
        <div
          className="uppercase tracking-wide mb-1"
          style={{ fontSize: "10px", color: "#ff8c00" }}
        >
          Treasury Yields
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {stats.treasuryYields.map((y: TreasuryYield) => {
            const changeColor = y.change >= 0 ? "#00d4aa" : "#ff4757";
            const arrow = y.change >= 0 ? "\u25B2" : "\u25BC";

            return (
              <div key={y.maturity} className="flex items-center justify-between">
                <span style={{ fontSize: "10px", color: "#ff8c00" }}>{y.maturity}</span>
                <div className="flex items-center gap-1">
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#e8edf3",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 500,
                    }}
                  >
                    {y.value.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: "9px", color: changeColor }}>
                    {arrow} {Math.abs(y.change).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advance/Decline */}
      <div className="mb-3">
        <div
          className="uppercase tracking-wide mb-1"
          style={{ fontSize: "10px", color: "#ff8c00" }}
        >
          Advance / Decline
        </div>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: "12px",
              color: "#e8edf3",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            {adRatio.toFixed(2)}
          </span>
          <div className="flex-1" style={{ height: "6px", background: "#ff4757" }}>
            <div
              style={{
                height: "100%",
                width: `${adBarWidth}%`,
                background: "#00d4aa",
              }}
            />
          </div>
        </div>
      </div>

      {/* Market Breadth */}
      <div className="mb-3">
        <div
          className="uppercase tracking-wide mb-1"
          style={{ fontSize: "10px", color: "#ff8c00" }}
        >
          Market Breadth
        </div>
        <div className="flex items-center gap-1">
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: stats.marketBreadth >= 0 ? "#00d4aa" : "#ff4757",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {stats.marketBreadth >= 0 ? "+" : ""}
            {stats.marketBreadth.toFixed(2)}
          </span>
          <span style={{ fontSize: "10px", color: "#7a8a9e" }}>
            {stats.marketBreadth >= 0 ? "Positive" : "Negative"}
          </span>
        </div>
      </div>

      {/* Next Market Event */}
      <div>
        <div
          className="uppercase tracking-wide mb-1"
          style={{ fontSize: "10px", color: "#ff8c00" }}
        >
          Next Event
        </div>
        <div style={{ fontSize: "11px", color: "#e8edf3" }}>
          {stats.nextMarketEvent.name}
        </div>
        <div style={{ fontSize: "10px", color: "#7a8a9e" }}>
          {new Date(stats.nextMarketEvent.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}
