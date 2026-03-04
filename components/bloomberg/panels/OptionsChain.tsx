"use client";

import { useState } from "react";
import { optionsChainSPY } from "@/lib/mock-data";
import type { OptionStrike, OptionLeg } from "../types";

type ViewMode = "Calls + Puts" | "Calls" | "Puts";

const CURRENT_PRICE = 563.42;

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toString();
}

function formatIV(iv: number): string {
  return Math.round(iv * 100) + "%";
}

const LEG_HEADERS = ["Last", "Bid", "Ask", "Vol", "OI", "IV"];

function LegCells({ leg, bg }: { leg: OptionLeg; bg: string }) {
  return (
    <>
      <td className="px-1.5 py-0" style={{ color: "#e8edf3", textAlign: "right", background: bg }}>
        {leg.last.toFixed(2)}
      </td>
      <td className="px-1.5 py-0" style={{ color: "#e8edf3", textAlign: "right", background: bg }}>
        {leg.bid.toFixed(2)}
      </td>
      <td className="px-1.5 py-0" style={{ color: "#e8edf3", textAlign: "right", background: bg }}>
        {leg.ask.toFixed(2)}
      </td>
      <td className="px-1.5 py-0" style={{ color: "#7a8a9e", textAlign: "right", background: bg }}>
        {formatVolume(leg.volume)}
      </td>
      <td className="px-1.5 py-0" style={{ color: "#7a8a9e", textAlign: "right", background: bg }}>
        {formatVolume(leg.openInterest)}
      </td>
      <td className="px-1.5 py-0" style={{ color: "#7a8a9e", textAlign: "right", background: bg }}>
        {formatIV(leg.iv)}
      </td>
    </>
  );
}

export default function OptionsChain() {
  const [viewMode, setViewMode] = useState<ViewMode>("Calls + Puts");
  const chain = optionsChainSPY;

  const atmStrike = chain.strikes.reduce((closest, s) =>
    Math.abs(s.strike - CURRENT_PRICE) < Math.abs(closest.strike - CURRENT_PRICE) ? s : closest
  );

  const showCalls = viewMode === "Calls + Puts" || viewMode === "Calls";
  const showPuts = viewMode === "Calls + Puts" || viewMode === "Puts";

  return (
    <div className="flex h-full flex-col" style={{ background: "#0a0e14" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ borderBottom: "1px solid #2a3545", background: "#111820" }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: "#ff8c00", fontWeight: 600, fontSize: "12px" }}>
            {chain.ticker}
          </span>
          <span style={{ color: "#e8edf3", fontSize: "12px", fontWeight: 600 }}>
            {CURRENT_PRICE.toFixed(2)}
          </span>
          <span
            className="px-2 py-0.5"
            style={{
              fontSize: "10px",
              color: "#7a8a9e",
              background: "#1a2130",
              border: "1px solid #2a3545",
            }}
          >
            {chain.expiration}
          </span>
        </div>
        <div className="flex" style={{ border: "1px solid #2a3545" }}>
          {(["Calls + Puts", "Calls", "Puts"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-2 py-0.5"
              style={{
                fontSize: "10px",
                color: viewMode === mode ? "#e8edf3" : "#7a8a9e",
                background: viewMode === mode ? "#2a3545" : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-xs"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <thead>
            <tr>
              {showCalls &&
                LEG_HEADERS.map((h) => (
                  <th
                    key={`call-${h}`}
                    className="sticky top-0 z-10 px-1.5 py-1 font-normal uppercase tracking-wide"
                    style={{
                      fontSize: "10px",
                      color: "#7a8a9e",
                      background: "#111820",
                      textAlign: "right",
                      borderBottom: "1px solid #2a3545",
                    }}
                  >
                    {h}
                  </th>
                ))}
              <th
                className="sticky top-0 z-10 px-2 py-1 font-normal uppercase tracking-wide"
                style={{
                  fontSize: "10px",
                  color: "#7a8a9e",
                  background: "#1a2130",
                  textAlign: "center",
                  borderBottom: "1px solid #2a3545",
                }}
              >
                Strike
              </th>
              {showPuts &&
                LEG_HEADERS.map((h) => (
                  <th
                    key={`put-${h}`}
                    className="sticky top-0 z-10 px-1.5 py-1 font-normal uppercase tracking-wide"
                    style={{
                      fontSize: "10px",
                      color: "#7a8a9e",
                      background: "#111820",
                      textAlign: "right",
                      borderBottom: "1px solid #2a3545",
                    }}
                  >
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {chain.strikes.map((row: OptionStrike, idx: number) => {
              const isATM = row.strike === atmStrike.strike;
              const callITM = row.strike < CURRENT_PRICE;
              const putITM = row.strike > CURRENT_PRICE;
              const isEven = idx % 2 === 0;
              const baseBg = isEven ? "#111820" : "#151d2a";

              const callBg = callITM ? "rgba(0,212,170,0.05)" : baseBg;
              const putBg = putITM ? "rgba(255,71,87,0.05)" : baseBg;

              return (
                <tr
                  key={row.strike}
                  style={{
                    height: "22px",
                    borderLeft: isATM ? "2px solid #ff8c00" : "2px solid transparent",
                  }}
                >
                  {showCalls && <LegCells leg={row.calls} bg={callBg} />}
                  <td
                    className="px-2 py-0"
                    style={{
                      textAlign: "center",
                      fontWeight: 600,
                      color: isATM ? "#ff8c00" : "#e8edf3",
                      background: "#1a2130",
                      fontSize: "11px",
                    }}
                  >
                    {row.strike}
                  </td>
                  {showPuts && <LegCells leg={row.puts} bg={putBg} />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
