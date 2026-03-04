"use client";

import { useAtomValue } from "jotai";
import { aiResearchNVDA } from "@/lib/mock-data";
import { activeTickerAtom } from "../atoms";

function getConfidenceColor(confidence: number): string {
  if (confidence >= 70) return "#00d4aa";
  if (confidence >= 40) return "#ff8c00";
  return "#ff4757";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 70) return "HIGH";
  if (confidence >= 40) return "MEDIUM";
  return "LOW";
}

export default function AIResearch() {
  const activeTicker = useAtomValue(activeTickerAtom);
  // Phase 1: always show NVDA research regardless of active ticker
  const research = aiResearchNVDA;

  const { keyLevels } = research;
  const rangeWidth = keyLevels.high52w - keyLevels.low52w;
  const currentPct =
    rangeWidth > 0
      ? ((keyLevels.current - keyLevels.low52w) / rangeWidth) * 100
      : 50;
  const supportPct =
    rangeWidth > 0
      ? ((keyLevels.support - keyLevels.low52w) / rangeWidth) * 100
      : 25;
  const resistancePct =
    rangeWidth > 0
      ? ((keyLevels.resistance - keyLevels.low52w) / rangeWidth) * 100
      : 75;

  const confColor = getConfidenceColor(research.confidence);
  const confLabel = getConfidenceLabel(research.confidence);

  return (
    <div
      className="h-full overflow-auto p-3 space-y-4 text-xs"
      style={{ background: "#0a0e14", fontVariantNumeric: "tabular-nums" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-xs font-bold"
            style={{ background: "#ff8c00", color: "#0a0e14" }}
          >
            {research.ticker}
          </span>
          <span style={{ color: "#e8edf3", fontSize: "12px" }}>
            NVIDIA Corp.
          </span>
        </div>
        <span style={{ fontSize: "10px", color: "#7a8a9e" }}>
          Generated at 2026-03-03 14:30 UTC
        </span>
      </div>

      {/* SUMMARY */}
      <div>
        <div
          className="mb-1.5 font-semibold uppercase tracking-wider"
          style={{ fontSize: "10px", color: "#4fc3f7" }}
        >
          Summary
        </div>
        <p className="leading-relaxed" style={{ color: "#e8edf3" }}>
          {research.summary}
        </p>
      </div>

      {/* BULL CASE */}
      <div>
        <div
          className="mb-1.5 font-semibold uppercase tracking-wider"
          style={{ fontSize: "10px", color: "#4fc3f7" }}
        >
          Bull Case
        </div>
        <div className="space-y-1.5">
          {research.bullCase.map((point, i) => (
            <div
              key={i}
              className="pl-3 py-1.5 pr-2"
              style={{
                borderLeft: "3px solid #00d4aa",
                background: "rgba(0, 212, 170, 0.05)",
                color: "#e8edf3",
              }}
            >
              {point}
            </div>
          ))}
        </div>
      </div>

      {/* BEAR CASE */}
      <div>
        <div
          className="mb-1.5 font-semibold uppercase tracking-wider"
          style={{ fontSize: "10px", color: "#4fc3f7" }}
        >
          Bear Case
        </div>
        <div className="space-y-1.5">
          {research.bearCase.map((point, i) => (
            <div
              key={i}
              className="pl-3 py-1.5 pr-2"
              style={{
                borderLeft: "3px solid #ff4757",
                background: "rgba(255, 71, 87, 0.05)",
                color: "#e8edf3",
              }}
            >
              {point}
            </div>
          ))}
        </div>
      </div>

      {/* KEY LEVELS */}
      <div>
        <div
          className="mb-1.5 font-semibold uppercase tracking-wider"
          style={{ fontSize: "10px", color: "#4fc3f7" }}
        >
          Key Levels
        </div>
        <div className="relative mt-3 mb-2">
          {/* 52-week range bar */}
          <div className="relative h-3" style={{ background: "#1a2130" }}>
            {/* Green zone (low52w to support) */}
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${supportPct}%`,
                background: "rgba(0, 212, 170, 0.25)",
              }}
            />
            {/* Red zone (resistance to high52w) */}
            <div
              className="absolute inset-y-0 right-0"
              style={{
                width: `${100 - resistancePct}%`,
                background: "rgba(255, 71, 87, 0.25)",
              }}
            />
            {/* Support marker */}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${supportPct}%`,
                background: "#00d4aa",
              }}
            />
            {/* Resistance marker */}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${resistancePct}%`,
                background: "#ff4757",
              }}
            />
            {/* Current price marker */}
            <div
              className="absolute"
              style={{
                left: `${currentPct}%`,
                top: "-2px",
                transform: "translateX(-50%)",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "6px solid #ff8c00",
                }}
              />
            </div>
          </div>
          {/* Labels */}
          <div className="flex justify-between mt-2" style={{ fontSize: "10px" }}>
            <div className="text-left">
              <div style={{ color: "#7a8a9e" }}>52W Low</div>
              <div style={{ color: "#e8edf3" }}>${keyLevels.low52w.toFixed(2)}</div>
            </div>
            <div className="text-center" style={{ position: "relative", left: `${supportPct - 50}%` }}>
              <div style={{ color: "#00d4aa" }}>Support</div>
              <div style={{ color: "#e8edf3" }}>${keyLevels.support.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div style={{ color: "#ff8c00" }}>Current</div>
              <div style={{ color: "#e8edf3" }}>${keyLevels.current.toFixed(2)}</div>
            </div>
            <div className="text-center" style={{ position: "relative", right: `${(100 - resistancePct) - 50}%` }}>
              <div style={{ color: "#ff4757" }}>Resistance</div>
              <div style={{ color: "#e8edf3" }}>${keyLevels.resistance.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div style={{ color: "#7a8a9e" }}>52W High</div>
              <div style={{ color: "#e8edf3" }}>${keyLevels.high52w.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CATALYSTS */}
      <div>
        <div
          className="mb-1.5 font-semibold uppercase tracking-wider"
          style={{ fontSize: "10px", color: "#4fc3f7" }}
        >
          Catalysts
        </div>
        <div className="space-y-1.5">
          {research.catalysts.map((cat, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="shrink-0 px-1.5 py-0.5 font-semibold"
                style={{
                  fontSize: "10px",
                  background: "#ff8c00",
                  color: "#0a0e14",
                }}
              >
                {cat.date}
              </span>
              <span style={{ color: "#e8edf3" }}>{cat.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* VERDICT */}
      <div>
        <div
          className="mb-1.5 font-semibold uppercase tracking-wider"
          style={{ fontSize: "10px", color: "#4fc3f7" }}
        >
          Verdict
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold" style={{ color: "#e8edf3", fontSize: "13px" }}>
            {research.verdict}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="px-1.5 py-0.5 text-xs font-bold"
              style={{ background: confColor, color: "#0a0e14", fontSize: "10px" }}
            >
              {confLabel}
            </span>
            <span style={{ color: "#7a8a9e", fontSize: "10px" }}>
              ({research.confidence}% confidence)
            </span>
          </span>
        </div>
      </div>

      {/* Regenerate button */}
      <div className="pt-2">
        <button
          className="px-3 py-1.5 text-xs cursor-pointer transition-colors"
          style={{
            border: "1px solid #2a3545",
            background: "transparent",
            color: "#7a8a9e",
            borderRadius: "0px",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.color = "#e8edf3";
            (e.target as HTMLButtonElement).style.borderColor = "#7a8a9e";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.color = "#7a8a9e";
            (e.target as HTMLButtonElement).style.borderColor = "#2a3545";
          }}
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
