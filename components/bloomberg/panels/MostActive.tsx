"use client";

import { useState, useMemo } from "react";
import { useMovers } from "@/lib/hooks";
import { topGainers as mockGainers, topLosers as mockLosers } from "@/lib/mock-data";
import type { MoverStock } from "../types";

type Tab = "Gainers" | "Losers";

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(1) + "B";
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toString();
}

function formatChange(val: number, isGainer: boolean): string {
  if (isGainer) return "+" + val.toFixed(2);
  return val.toFixed(2);
}

function formatChangePct(val: number, isGainer: boolean): string {
  if (isGainer) return "+" + val.toFixed(2) + "%";
  return val.toFixed(2) + "%";
}

const COLUMNS: { label: string; align: "left" | "right" }[] = [
  { label: "Ticker", align: "left" },
  { label: "Last", align: "right" },
  { label: "Chg", align: "right" },
  { label: "Chg%", align: "right" },
  { label: "Volume", align: "right" },
];

export default function MostActive() {
  const [activeTab, setActiveTab] = useState<Tab>("Gainers");
  const isGainer = activeTab === "Gainers";

  const { data: apiGainers, isLoading: loadingGainers, isError: errorGainers } = useMovers("gainers");
  const { data: apiLosers, isLoading: loadingLosers, isError: errorLosers } = useMovers("losers");

  const gainers: MoverStock[] = useMemo(() => {
    if (apiGainers && Array.isArray(apiGainers) && apiGainers.length > 0) {
      return apiGainers as MoverStock[];
    }
    return mockGainers;
  }, [apiGainers]);

  const losers: MoverStock[] = useMemo(() => {
    if (apiLosers && Array.isArray(apiLosers) && apiLosers.length > 0) {
      return apiLosers as MoverStock[];
    }
    return mockLosers;
  }, [apiLosers]);

  const data: MoverStock[] = isGainer ? gainers : losers;
  const isLoading = isGainer ? loadingGainers : loadingLosers;
  const isError = isGainer ? errorGainers : errorLosers;
  const changeColor = isGainer ? "#00d4aa" : "#ff4757";

  return (
    <div className="flex h-full flex-col" style={{ background: "#0a0e14" }}>
      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-2 py-1 shrink-0"
        style={{ borderBottom: "1px solid #2a3545", background: "#111820" }}
      >
        {(["Gainers", "Losers"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-2 py-0.5"
            style={{
              fontSize: "10px",
              color: activeTab === tab ? "#e8edf3" : "#7a8a9e",
              background: activeTab === tab ? "#2a3545" : "transparent",
              border: "none",
              cursor: "pointer",
              borderBottom:
                activeTab === tab
                  ? `1px solid ${tab === "Gainers" ? "#00d4aa" : "#ff4757"}`
                  : "1px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
        {isLoading && (
          <span
            className="ml-auto inline-block animate-pulse"
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#ff8c00",
            }}
          />
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading && data.length === 0 ? (
          <div
            className="flex h-full items-center justify-center"
            style={{ color: "#3a4553", fontSize: "11px" }}
          >
            Loading...
          </div>
        ) : (
          <table
            className="w-full border-collapse text-xs"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    className="sticky top-0 z-10 px-2 py-1 font-normal uppercase tracking-wide"
                    style={{
                      fontSize: "10px",
                      color: "#7a8a9e",
                      background: "#111820",
                      textAlign: col.align,
                      borderBottom: "1px solid #2a3545",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((stock: MoverStock, idx: number) => {
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? "#111820" : "#151d2a";

                return (
                  <tr key={stock.ticker} style={{ height: "24px", background: rowBg }}>
                    <td
                      className="px-2 py-0.5"
                      style={{ color: "#e8edf3", fontWeight: 600, textAlign: "left" }}
                    >
                      {stock.ticker}
                    </td>
                    <td className="px-2 py-0.5" style={{ color: "#e8edf3", textAlign: "right" }}>
                      {stock.last.toFixed(2)}
                    </td>
                    <td className="px-2 py-0.5" style={{ color: changeColor, textAlign: "right" }}>
                      {formatChange(stock.change, isGainer)}
                    </td>
                    <td className="px-2 py-0.5" style={{ color: changeColor, textAlign: "right" }}>
                      {formatChangePct(stock.changePct, isGainer)}
                    </td>
                    <td className="px-2 py-0.5" style={{ color: "#7a8a9e", textAlign: "right" }}>
                      {formatVolume(stock.volume)}
                    </td>
                  </tr>
                );
              })}
              {isError && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-1 text-center"
                    style={{ color: "#ff4757", fontSize: "10px" }}
                  >
                    API error - showing cached data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
