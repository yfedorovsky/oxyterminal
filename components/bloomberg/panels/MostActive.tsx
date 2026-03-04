"use client";

import { useState } from "react";
import { topGainers, topLosers } from "@/lib/mock-data";
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
  const data: MoverStock[] = isGainer ? topGainers : topLosers;
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
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
