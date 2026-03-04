"use client";

import { useState } from "react";
import { financialsAAPL } from "@/lib/mock-data";

type FinancialTab = "Income" | "Balance Sheet" | "Cash Flow";

function formatBillions(val: number): string {
  return "$" + (val / 1_000_000_000).toFixed(1) + "B";
}

function formatPct(val: number): string {
  const prefix = val > 0 ? "+" : "";
  return prefix + (val * 100).toFixed(1) + "%";
}

interface RowDef {
  label: string;
  key: "revenue" | "grossProfit" | "operatingIncome" | "netIncome" | "eps" | "revenueGrowth";
  format: (val: number) => string;
  colorize?: boolean;
}

const ROWS: RowDef[] = [
  { label: "Revenue", key: "revenue", format: formatBillions },
  { label: "Gross Profit", key: "grossProfit", format: formatBillions },
  { label: "Operating Income", key: "operatingIncome", format: formatBillions },
  { label: "Net Income", key: "netIncome", format: formatBillions },
  { label: "EPS", key: "eps", format: (v: number) => "$" + v.toFixed(2) },
  { label: "Revenue Growth", key: "revenueGrowth", format: formatPct, colorize: true },
];

const TABS: FinancialTab[] = ["Income", "Balance Sheet", "Cash Flow"];

export default function Financials() {
  const [activeTab, setActiveTab] = useState<FinancialTab>("Income");
  const data = financialsAAPL;

  return (
    <div className="flex h-full flex-col" style={{ background: "#0a0e14" }}>
      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-2 py-1 shrink-0"
        style={{ borderBottom: "1px solid #2a3545", background: "#111820" }}
      >
        <span
          className="mr-3"
          style={{ color: "#ff8c00", fontWeight: 600, fontSize: "12px" }}
        >
          {data.ticker}
        </span>
        {TABS.map((tab) => (
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
              borderBottom: activeTab === tab ? "1px solid #ff8c00" : "1px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "Income" ? (
          <table
            className="w-full border-collapse text-xs"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <thead>
              <tr>
                <th
                  className="sticky top-0 left-0 z-20 px-2 py-1 font-normal uppercase tracking-wide"
                  style={{
                    fontSize: "10px",
                    color: "#7a8a9e",
                    background: "#111820",
                    textAlign: "left",
                    borderBottom: "1px solid #2a3545",
                    minWidth: "120px",
                  }}
                >
                  Metric
                </th>
                {data.quarters.map((q) => (
                  <th
                    key={q.quarter}
                    className="sticky top-0 z-10 px-2 py-1 font-normal uppercase tracking-wide"
                    style={{
                      fontSize: "10px",
                      color: "#7a8a9e",
                      background: "#111820",
                      textAlign: "right",
                      borderBottom: "1px solid #2a3545",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {q.quarter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, rowIdx) => {
                const isEven = rowIdx % 2 === 0;
                const rowBg = isEven ? "#111820" : "#151d2a";

                return (
                  <tr key={row.key} style={{ height: "24px", background: rowBg }}>
                    <td
                      className="sticky left-0 z-10 px-2 py-0.5 font-normal uppercase tracking-wide"
                      style={{
                        fontSize: "10px",
                        color: "#7a8a9e",
                        background: rowBg,
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.label}
                    </td>
                    {data.quarters.map((q) => {
                      const val = q[row.key];
                      const color = row.colorize
                        ? val >= 0
                          ? "#00d4aa"
                          : "#ff4757"
                        : "#e8edf3";

                      return (
                        <td
                          key={q.quarter}
                          className="px-2 py-0.5"
                          style={{
                            color,
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.format(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{ color: "#7a8a9e", fontSize: "11px" }}
          >
            Coming in Phase 2
          </div>
        )}
      </div>
    </div>
  );
}
