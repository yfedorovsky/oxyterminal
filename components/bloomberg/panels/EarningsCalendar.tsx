"use client";

import { earningsCalendar } from "@/lib/mock-data";
import type { EarningsItem } from "../types";

const TODAY = new Date().toISOString().slice(0, 10);

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRevenue(val: number): string {
  if (val >= 1_000_000_000) return "$" + (val / 1_000_000_000).toFixed(1) + "B";
  if (val >= 1_000_000) return "$" + (val / 1_000_000).toFixed(0) + "M";
  return "$" + val.toLocaleString();
}

const COLUMNS: { label: string; align: "left" | "right" | "center" }[] = [
  { label: "Date", align: "left" },
  { label: "Ticker", align: "left" },
  { label: "Company", align: "left" },
  { label: "EPS Est.", align: "right" },
  { label: "Rev Est.", align: "right" },
  { label: "Time", align: "center" },
];

export default function EarningsCalendar() {
  return (
    <div className="h-full overflow-auto" style={{ background: "#0a0e14" }}>
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
          {earningsCalendar.map((item: EarningsItem, idx: number) => {
            const isToday = item.date === TODAY;
            const isEven = idx % 2 === 0;
            const rowBg = isEven ? "#111820" : "#151d2a";

            return (
              <tr
                key={`${item.ticker}-${item.date}`}
                style={{ height: "26px", background: rowBg }}
              >
                <td className="px-2 py-0.5" style={{ color: "#7a8a9e", textAlign: "left" }}>
                  {formatDate(item.date)}
                </td>
                <td className="px-2 py-0.5" style={{ textAlign: "left" }}>
                  <span className="flex items-center gap-1.5">
                    {isToday && (
                      <span
                        className="inline-block shrink-0 animate-pulse"
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#00d4aa",
                        }}
                      />
                    )}
                    <span style={{ color: "#e8edf3", fontWeight: 600, cursor: "pointer" }}>
                      {item.ticker}
                    </span>
                  </span>
                </td>
                <td
                  className="px-2 py-0.5 truncate"
                  style={{ color: "#7a8a9e", textAlign: "left", maxWidth: "180px" }}
                >
                  {item.company}
                </td>
                <td className="px-2 py-0.5" style={{ color: "#e8edf3", textAlign: "right" }}>
                  ${item.epsEstimate.toFixed(2)}
                </td>
                <td className="px-2 py-0.5" style={{ color: "#e8edf3", textAlign: "right" }}>
                  {formatRevenue(item.revenueEstimate)}
                </td>
                <td className="px-2 py-0.5" style={{ textAlign: "center" }}>
                  <span
                    className="inline-block px-1.5 py-0"
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      background: "#2a3545",
                      color: item.time === "BMO" ? "#ff8c00" : "#4fc3f7",
                    }}
                  >
                    {item.time}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
