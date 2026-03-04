"use client";

import { useMemo } from "react";
import { sectorData } from "@/lib/mock-data";
import type { SectorData } from "../types";

function formatPerformance(val: number): string {
  const prefix = val > 0 ? "+" : "";
  return prefix + val.toFixed(2) + "%";
}

export default function SectorLeaders() {
  const maxAbs = useMemo(
    () => Math.max(...sectorData.map((s) => Math.abs(s.performance))),
    []
  );

  return (
    <div className="h-full overflow-auto" style={{ background: "#0a0e14" }}>
      {sectorData.map((sector: SectorData, idx: number) => {
        const isEven = idx % 2 === 0;
        const rowBg = isEven ? "#111820" : "#151d2a";
        const isPositive = sector.performance >= 0;
        const perfColor = isPositive ? "#00d4aa" : "#ff4757";
        const barWidth = maxAbs > 0 ? (Math.abs(sector.performance) / maxAbs) * 100 : 0;

        return (
          <div
            key={sector.name}
            className="px-3 py-1.5"
            style={{ background: rowBg, minHeight: "36px" }}
          >
            {/* Top row: sector name + performance */}
            <div className="flex items-center justify-between">
              <span style={{ color: "#e8edf3", fontSize: "11px" }}>{sector.name}</span>
              <div className="flex items-center gap-2">
                {/* Mini bar */}
                <div
                  className="relative"
                  style={{ width: "60px", height: "6px", background: "#1a2130" }}
                >
                  {isPositive ? (
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: 0,
                        height: "100%",
                        width: `${barWidth / 2}%`,
                        background: "#00d4aa",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        right: "50%",
                        top: 0,
                        height: "100%",
                        width: `${barWidth / 2}%`,
                        background: "#ff4757",
                      }}
                    />
                  )}
                  {/* Center line */}
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      width: "1px",
                      height: "100%",
                      background: "#2a3545",
                    }}
                  />
                </div>
                <span
                  style={{
                    color: perfColor,
                    fontSize: "11px",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: "52px",
                    textAlign: "right",
                  }}
                >
                  {formatPerformance(sector.performance)}
                </span>
              </div>
            </div>

            {/* Leader pills */}
            <div className="mt-0.5 flex gap-1">
              {sector.leaders.map((leader) => (
                <span
                  key={leader.ticker}
                  style={{
                    fontSize: "10px",
                    color: "#7a8a9e",
                  }}
                >
                  {leader.ticker}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
