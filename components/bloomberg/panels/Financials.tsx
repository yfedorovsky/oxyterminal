"use client";

import { useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { useFinancials, useBalanceSheet, useCashFlow } from "@/lib/hooks";
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

function formatRatio(val: number): string {
  return val.toFixed(2) + "x";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GenericRowDef<T = any> {
  label: string;
  key: string;
  format: (val: number) => string;
  colorize?: boolean;
  getValue?: (item: T) => number;
}

const INCOME_ROWS: GenericRowDef[] = [
  { label: "Revenue", key: "revenue", format: formatBillions },
  { label: "Gross Profit", key: "grossProfit", format: formatBillions },
  { label: "Operating Income", key: "operatingIncome", format: formatBillions },
  { label: "Net Income", key: "netIncome", format: formatBillions },
  { label: "EPS", key: "eps", format: (v: number) => "$" + v.toFixed(2) },
  { label: "Revenue Growth", key: "revenueGrowth", format: formatPct, colorize: true },
];

const BALANCE_SHEET_ROWS: GenericRowDef[] = [
  { label: "Total Assets", key: "totalAssets", format: formatBillions },
  { label: "Total Liabilities", key: "totalLiabilities", format: formatBillions },
  { label: "Total Equity", key: "totalEquity", format: formatBillions },
  { label: "Cash & Equivalents", key: "cash", format: formatBillions },
  { label: "Total Debt", key: "totalDebt", format: formatBillions },
  { label: "Net Debt", key: "netDebt", format: formatBillions },
  { label: "Current Ratio", key: "currentRatio", format: formatRatio },
];

const CASH_FLOW_ROWS: GenericRowDef[] = [
  { label: "Operating Cash Flow", key: "operatingCashFlow", format: formatBillions },
  { label: "Capital Expenditure", key: "capitalExpenditure", format: formatBillions },
  { label: "Free Cash Flow", key: "freeCashFlow", format: formatBillions, colorize: true },
  { label: "Net Income", key: "netIncome", format: formatBillions },
  { label: "Stock-Based Comp", key: "stockBasedCompensation", format: formatBillions },
  { label: "Dividends Paid", key: "dividendsPaid", format: formatBillions },
  { label: "Buybacks", key: "commonStockRepurchased", format: formatBillions },
];

const TABS: FinancialTab[] = ["Income", "Balance Sheet", "Cash Flow"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FinancialTable({ rows, quarters, isError }: { rows: GenericRowDef[]; quarters: Record<string, any>[]; isError?: boolean }) {
  if (!quarters || quarters.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ color: "#7a8a9e", fontSize: "11px" }}
      >
        No data available
      </div>
    );
  }

  return (
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
          {quarters.map((q) => (
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
        {rows.map((row, rowIdx) => {
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
              {quarters.map((q) => {
                const val = row.getValue ? row.getValue(q) : q[row.key];
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
              colSpan={quarters.length + 1}
              className="px-2 py-1 text-center"
              style={{ color: "#ff4757", fontSize: "10px" }}
            >
              API error - showing cached data
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default function Financials() {
  const [activeTab, setActiveTab] = useState<FinancialTab>("Income");
  const activeTicker = useAtomValue(activeTickerAtom);

  const { data: apiFinancials, isLoading: incomeLoading, isError: incomeError } = useFinancials(activeTicker);
  const { data: balanceSheetData, isLoading: bsLoading, isError: bsError } = useBalanceSheet(activeTicker);
  const { data: cashFlowData, isLoading: cfLoading, isError: cfError } = useCashFlow(activeTicker);

  // Map API data to our FinancialsData shape for Income Statement
  const incomeData: FinancialsData = useMemo(() => {
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

  const isLoading =
    activeTab === "Income" ? incomeLoading :
    activeTab === "Balance Sheet" ? bsLoading :
    cfLoading;

  const hasNoData =
    activeTab === "Income" ? !apiFinancials :
    activeTab === "Balance Sheet" ? !balanceSheetData :
    !cashFlowData;

  if (isLoading && hasNoData) {
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
          {activeTicker}
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
        {activeTab === "Income" && (
          <FinancialTable
            rows={INCOME_ROWS}
            quarters={incomeData.quarters}
            isError={incomeError}
          />
        )}
        {activeTab === "Balance Sheet" && (
          <FinancialTable
            rows={BALANCE_SHEET_ROWS}
            quarters={Array.isArray(balanceSheetData) ? balanceSheetData : []}
            isError={bsError}
          />
        )}
        {activeTab === "Cash Flow" && (
          <FinancialTable
            rows={CASH_FLOW_ROWS}
            quarters={Array.isArray(cashFlowData) ? cashFlowData : []}
            isError={cfError}
          />
        )}
      </div>
    </div>
  );
}
