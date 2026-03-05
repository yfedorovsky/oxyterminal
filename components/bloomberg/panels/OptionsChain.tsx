"use client";

import { useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { activeTickerAtom } from "../atoms";
import {
  useOptionsExpirations,
  useOptionsChain,
  useTradierQuote,
} from "@/lib/hooks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ViewMode = "Calls + Puts" | "Calls" | "Puts";
type GreekDisplay = "iv" | "delta" | "gamma" | "theta" | "vega";

interface ParsedStrike {
  strike: number;
  call: ParsedLeg | null;
  put: ParsedLeg | null;
}

interface ParsedLeg {
  last: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toString();
}

function formatGreek(value: number, type: GreekDisplay): string {
  if (type === "iv") return (value * 100).toFixed(1) + "%";
  if (type === "delta") return value.toFixed(3);
  if (type === "gamma") return value.toFixed(4);
  if (type === "theta") return value.toFixed(3);
  if (type === "vega") return value.toFixed(3);
  return value.toFixed(3);
}

function daysUntil(dateStr: string): number {
  const exp = new Date(dateStr + "T16:00:00-05:00"); // 4pm ET
  const now = new Date();
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000));
}

function formatExpLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const mon = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const yr = d.getFullYear().toString().slice(-2);
  const dte = daysUntil(dateStr);
  return `${mon} ${day} '${yr} (${dte}d)`;
}

// ---------------------------------------------------------------------------
// Leg cells component
// ---------------------------------------------------------------------------
const HEADERS_BASE = ["Last", "Bid", "Ask", "Vol", "OI"];

function LegCells({
  leg,
  bg,
  greekDisplay,
}: {
  leg: ParsedLeg | null;
  bg: string;
  greekDisplay: GreekDisplay;
}) {
  if (!leg) {
    return (
      <>
        {[...HEADERS_BASE, greekDisplay.toUpperCase()].map((_, i) => (
          <td
            key={i}
            className="px-1.5 py-0"
            style={{ textAlign: "right", background: bg, color: "#2a3545" }}
          >
            —
          </td>
        ))}
      </>
    );
  }

  const greekVal =
    greekDisplay === "iv"
      ? leg.iv
      : greekDisplay === "delta"
      ? leg.delta
      : greekDisplay === "gamma"
      ? leg.gamma
      : greekDisplay === "theta"
      ? leg.theta
      : leg.vega;

  const greekColor =
    greekDisplay === "theta"
      ? "#ff4757"
      : greekDisplay === "delta"
      ? "#4fc3f7"
      : "#7a8a9e";

  return (
    <>
      <td
        className="px-1.5 py-0"
        style={{ color: "#e8edf3", textAlign: "right", background: bg }}
      >
        {leg.last > 0 ? leg.last.toFixed(2) : "—"}
      </td>
      <td
        className="px-1.5 py-0"
        style={{ color: "#e8edf3", textAlign: "right", background: bg }}
      >
        {leg.bid.toFixed(2)}
      </td>
      <td
        className="px-1.5 py-0"
        style={{ color: "#e8edf3", textAlign: "right", background: bg }}
      >
        {leg.ask.toFixed(2)}
      </td>
      <td
        className="px-1.5 py-0"
        style={{ color: "#7a8a9e", textAlign: "right", background: bg }}
      >
        {formatVolume(leg.volume)}
      </td>
      <td
        className="px-1.5 py-0"
        style={{ color: "#7a8a9e", textAlign: "right", background: bg }}
      >
        {formatVolume(leg.openInterest)}
      </td>
      <td
        className="px-1.5 py-0"
        style={{ color: greekColor, textAlign: "right", background: bg }}
      >
        {formatGreek(greekVal, greekDisplay)}
      </td>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function OptionsChain() {
  const activeTicker = useAtomValue(activeTickerAtom);
  const [viewMode, setViewMode] = useState<ViewMode>("Calls + Puts");
  const [greekDisplay, setGreekDisplay] = useState<GreekDisplay>("iv");
  const [selectedExpIdx, setSelectedExpIdx] = useState(0);

  // Fetch expirations
  const { data: expirations, isLoading: expLoading } =
    useOptionsExpirations(activeTicker);

  // Pick expiration
  const expiration = expirations?.[selectedExpIdx] ?? "";

  // Fetch chain + underlying quote
  const { data: rawOptions, isLoading: chainLoading } = useOptionsChain(
    activeTicker,
    expiration
  );
  const { data: quote } = useTradierQuote(activeTicker);

  const currentPrice = quote?.last ?? 0;

  // Parse raw options into strike rows
  const strikes: ParsedStrike[] = useMemo(() => {
    if (!rawOptions || rawOptions.length === 0) return [];

    const map = new Map<number, { call?: ParsedLeg; put?: ParsedLeg }>();

    for (const opt of rawOptions) {
      const leg: ParsedLeg = {
        last: opt.last ?? 0,
        bid: opt.bid ?? 0,
        ask: opt.ask ?? 0,
        volume: opt.volume ?? 0,
        openInterest: opt.open_interest ?? 0,
        iv: opt.greeks?.mid_iv ?? 0,
        delta: opt.greeks?.delta ?? 0,
        gamma: opt.greeks?.gamma ?? 0,
        theta: opt.greeks?.theta ?? 0,
        vega: opt.greeks?.vega ?? 0,
      };

      const entry = map.get(opt.strike) ?? {};
      if (opt.option_type === "call") {
        entry.call = leg;
      } else {
        entry.put = leg;
      }
      map.set(opt.strike, entry);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([strike, { call, put }]) => ({
        strike,
        call: call ?? null,
        put: put ?? null,
      }));
  }, [rawOptions]);

  // Find ATM strike
  const atmStrike = useMemo(() => {
    if (strikes.length === 0 || currentPrice === 0) return 0;
    return strikes.reduce((closest, s) =>
      Math.abs(s.strike - currentPrice) < Math.abs(closest.strike - currentPrice)
        ? s
        : closest
    ).strike;
  }, [strikes, currentPrice]);

  const showCalls = viewMode === "Calls + Puts" || viewMode === "Calls";
  const showPuts = viewMode === "Calls + Puts" || viewMode === "Puts";
  const isLoading = expLoading || chainLoading;

  const greekLabel = greekDisplay.toUpperCase();
  const headers = [...HEADERS_BASE, greekLabel === "IV" ? "IV" : greekLabel];

  // GEX calculation (Gamma Exposure)
  const totalGEX = useMemo(() => {
    if (strikes.length === 0 || currentPrice === 0) return 0;
    let gex = 0;
    for (const row of strikes) {
      // GEX = gamma * OI * 100 * spot * 0.01
      // Calls add, puts subtract (dealer gamma)
      if (row.call && row.call.gamma > 0) {
        gex += row.call.gamma * row.call.openInterest * 100 * currentPrice * 0.01;
      }
      if (row.put && row.put.gamma > 0) {
        gex -= row.put.gamma * row.put.openInterest * 100 * currentPrice * 0.01;
      }
    }
    return gex;
  }, [strikes, currentPrice]);

  // P/C ratio from OI
  const pcRatio = useMemo(() => {
    let callOI = 0;
    let putOI = 0;
    for (const row of strikes) {
      if (row.call) callOI += row.call.openInterest;
      if (row.put) putOI += row.put.openInterest;
    }
    return callOI > 0 ? putOI / callOI : 0;
  }, [strikes]);

  return (
    <div className="flex h-full flex-col" style={{ background: "#0a0e14" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 shrink-0 gap-2"
        style={{ borderBottom: "1px solid #2a3545", background: "#111820" }}
      >
        <div className="flex items-center gap-3 shrink-0">
          <span style={{ color: "#ff8c00", fontWeight: 600, fontSize: "12px" }}>
            {activeTicker}
          </span>
          {currentPrice > 0 && (
            <span
              style={{ color: "#e8edf3", fontSize: "12px", fontWeight: 600 }}
            >
              {currentPrice.toFixed(2)}
            </span>
          )}
          {quote && quote.change !== 0 && (
            <span
              style={{
                fontSize: "10px",
                color: quote.change >= 0 ? "#00d4aa" : "#ff4757",
              }}
            >
              {quote.change >= 0 ? "+" : ""}
              {quote.change.toFixed(2)} (
              {quote.change_percentage >= 0 ? "+" : ""}
              {quote.change_percentage.toFixed(2)}%)
            </span>
          )}
        </div>

        {/* Expiration selector */}
        {expirations && expirations.length > 0 && (
          <select
            value={selectedExpIdx}
            onChange={(e) => setSelectedExpIdx(Number(e.target.value))}
            className="font-mono bg-transparent outline-none border shrink-0"
            style={{
              fontSize: "10px",
              color: "#e8edf3",
              borderColor: "#2a3545",
              padding: "2px 4px",
              maxWidth: 140,
            }}
          >
            {expirations.map((exp, idx) => (
              <option
                key={exp}
                value={idx}
                style={{ background: "#111820", color: "#e8edf3" }}
              >
                {formatExpLabel(exp)}
              </option>
            ))}
          </select>
        )}

        {/* Greek toggle */}
        <div className="flex shrink-0" style={{ border: "1px solid #2a3545" }}>
          {(["iv", "delta", "gamma", "theta", "vega"] as GreekDisplay[]).map(
            (g) => (
              <button
                key={g}
                onClick={() => setGreekDisplay(g)}
                className="px-1.5 py-0.5"
                style={{
                  fontSize: "9px",
                  color: greekDisplay === g ? "#e8edf3" : "#7a8a9e",
                  background: greekDisplay === g ? "#2a3545" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {g === "iv" ? "IV" : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            )
          )}
        </div>

        {/* View mode */}
        <div className="flex shrink-0" style={{ border: "1px solid #2a3545" }}>
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

      {/* Stats row */}
      <div
        className="flex items-center gap-4 px-3 py-1 shrink-0"
        style={{
          fontSize: "10px",
          borderBottom: "1px solid #2a3545",
          background: "#0d1117",
        }}
      >
        <span style={{ color: "#7a8a9e" }}>
          P/C:{" "}
          <span style={{ color: pcRatio > 1 ? "#ff4757" : "#00d4aa" }}>
            {pcRatio.toFixed(2)}
          </span>
        </span>
        <span style={{ color: "#7a8a9e" }}>
          GEX:{" "}
          <span style={{ color: totalGEX >= 0 ? "#00d4aa" : "#ff4757" }}>
            {totalGEX >= 0 ? "+" : ""}
            {(totalGEX / 1_000_000).toFixed(1)}M
          </span>
        </span>
        <span style={{ color: "#7a8a9e" }}>
          Strikes: <span style={{ color: "#e8edf3" }}>{strikes.length}</span>
        </span>
        {expiration && (
          <span style={{ color: "#7a8a9e" }}>
            DTE:{" "}
            <span style={{ color: "#ff8c00" }}>{daysUntil(expiration)}</span>
          </span>
        )}
      </div>

      {/* Loading state */}
      {isLoading && strikes.length === 0 && (
        <div
          className="flex-1 flex items-center justify-center font-mono text-xs"
          style={{ color: "#7a8a9e" }}
        >
          Loading options chain...
        </div>
      )}

      {/* Table */}
      {strikes.length > 0 && (
        <div className="flex-1 overflow-auto terminal-scrollbar">
          <table
            className="w-full border-collapse text-xs"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <thead>
              <tr>
                {showCalls &&
                  headers.map((h) => (
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
                  headers.map((h) => (
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
              {strikes.map((row, idx) => {
                const isATM = row.strike === atmStrike;
                const callITM = row.strike < currentPrice;
                const putITM = row.strike > currentPrice;
                const isEven = idx % 2 === 0;
                const baseBg = isEven ? "#111820" : "#151d2a";

                const callBg = callITM
                  ? "rgba(0,212,170,0.05)"
                  : baseBg;
                const putBg = putITM ? "rgba(255,71,87,0.05)" : baseBg;

                return (
                  <tr
                    key={row.strike}
                    style={{
                      height: "22px",
                      borderLeft: isATM
                        ? "2px solid #ff8c00"
                        : "2px solid transparent",
                    }}
                  >
                    {showCalls && (
                      <LegCells
                        leg={row.call}
                        bg={callBg}
                        greekDisplay={greekDisplay}
                      />
                    )}
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
                    {showPuts && (
                      <LegCells
                        leg={row.put}
                        bg={putBg}
                        greekDisplay={greekDisplay}
                      />
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No data state */}
      {!isLoading && strikes.length === 0 && (
        <div
          className="flex-1 flex items-center justify-center font-mono text-xs"
          style={{ color: "#7a8a9e" }}
        >
          {expirations && expirations.length === 0
            ? `No options available for ${activeTicker}`
            : "No chain data"}
        </div>
      )}
    </div>
  );
}
