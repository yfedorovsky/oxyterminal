"use client";

import { useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { useFinancials } from "@/lib/hooks";
import { financialsAAPL as mockFinancials } from "@/lib/mock-data";
import { activeTickerAtom } from "../atoms";
import type { FinancialsData } from "../types";

type FinancialTab = "Income" | "Balance Sheet" | "Cash Flow";

function formatBillions(val: number): string {
  return "$" + (val / 1_000_000_000).toFixed(1) + "B";
}

function formatPct(val: number): string {
  const prefix = val > 0 ? "+" : "";
  return prefix + val.toFixed(1) + "%";
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
  const activeTicker = useAtomValue(activeTickerAtom);

  const { data: apiFinancials, isLoading, isError } = useFinancials(activeTicker);

  // Map API data to our FinancialsData shape
  // API returns array of { quarter, revenue, grossProfit, operatingIncome, netIncome, eps, revenueGrowth }
  // where revenueGrowth is a percentage (e.g. 4.2 meaning 4.2%), but our mock uses decimal (0.042)
  const data: FinancialsData = useMemo(() => {
    if (apiFinancials && Array.isArray(apiFinancials) && apiFinancials.length > 0) {
      return {
        ticker: activeTicker,
        quarters: apiFinancials.map((q: { quarter: string; revenue: number; grossProfit: number; operatingIncome: number; netIncome: number; eps: number; revenueGrowth: number }) => ({
          quarter: q.quarter,
          revenue: q.revenue,
          grossProfit: q.grossProfit,
          operatingIncome: q.operatingIncome,
          netIncome: q.netIncome,
          eps: q.eps,
          revenueGrowth: q.revenueGrowth / 100, // Convert percentage to decimal for formatPct
        })),
      };
    }
    // Fallback to mock data, but show active ticker
    return { ...mockFinancials, ticker: activeTicker };
  }, [apiFinancials, activeTicker]);

  if (isLoading && !apiFinancials) {
    return (
      <div className="flex h-full flex-col" style={{ background: "#0a0e14" }}>
        <div
          className="flex items-center gap-0 px-2 py-1 shrink-0"
          style={{ borderBottom: "1px solid #2a3545", background: "#111820" }}
        >
          <span
            className="mr-3"
            style={{ color: "#ff8c00", fontWeight: 600, fontSize: "12px" }}
          >
            {activeTicker}
          </span>
        </div>
        <div
          className="flex flex-1 items-center justify-center"
          style={{ color: "#3a4553", fontSize: "11px" }}
        >
          Loading...
        </div>
      </div>
    );
  }

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
              {isError && (
                <tr>
                  <td
                    colSpan={data.quarters.length + 1}
                    className="px-2 py-1 text-center"
                    style={{ color: "#ff4757", fontSize: "10px" }}
                  >
                    API error - showing cached data
                  </td>
                </tr>
              )}
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
