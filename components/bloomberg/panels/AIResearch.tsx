"use client";

import { useAtomValue } from "jotai";
import { activeTickerAtom } from "../atoms";
import { useAIResearch } from "@/lib/hooks";

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

function getVerdictColor(verdict: string): string {
  const v = verdict.toUpperCase();
  if (v.includes("STRONG BUY") || v.includes("OVERWEIGHT")) return "#00d4aa";
  if (v.includes("SELL") || v.includes("UNDERWEIGHT")) return "#ff4757";
  return "#ff8c00";
}

// Loading skeleton matching terminal aesthetic
function LoadingSkeleton({ ticker }: { ticker: string }) {
  return (
    <div
      className="h-full overflow-auto p-3 space-y-4 text-xs"
      style={{ background: "#0a0e14" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="px-2 py-0.5 text-xs font-bold"
          style={{ background: "#ff8c00", color: "#0a0e14" }}
        >
          {ticker}
        </span>
        <span style={{ color: "#7a8a9e" }}>Generating research brief...</span>
      </div>

      {/* Animated pulse bars */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div
            className="h-2 animate-pulse"
            style={{
              background: "#1a2130",
              width: `${60 + Math.random() * 35}%`,
            }}
          />
          {i < 3 && (
            <div
              className="h-2 animate-pulse"
              style={{
                background: "#1a2130",
                width: `${40 + Math.random() * 40}%`,
              }}
            />
          )}
        </div>
      ))}

      <div
        className="text-center pt-4"
        style={{ color: "#7a8a9e", fontSize: "10px" }}
      >
        Querying Perplexity Sonar for real-time analysis...
      </div>
    </div>
  );
}

function ErrorState({
  ticker,
  error,
  onRetry,
}: {
  ticker: string;
  error: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="h-full flex flex-col items-center justify-center p-4 text-xs"
      style={{ background: "#0a0e14" }}
    >
      <div
        className="mb-2 font-bold"
        style={{ color: "#ff4757", fontSize: "12px" }}
      >
        Research brief failed
      </div>
      <div className="mb-4 text-center" style={{ color: "#7a8a9e" }}>
        Could not generate analysis for {ticker}
        <br />
        <span style={{ fontSize: "10px" }}>{error}</span>
      </div>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 text-xs cursor-pointer"
        style={{
          border: "1px solid #ff4757",
          background: "transparent",
          color: "#ff4757",
        }}
      >
        Retry
      </button>
    </div>
  );
}

export default function AIResearch() {
  const activeTicker = useAtomValue(activeTickerAtom);
  const { data: research, isLoading, error, refetch, isFetching } =
    useAIResearch(activeTicker);

  // Loading state
  if (isLoading || (!research && !error)) {
    return <LoadingSkeleton ticker={activeTicker} />;
  }

  // Error state
  if (error && !research) {
    return (
      <ErrorState
        ticker={activeTicker}
        error={error instanceof Error ? error.message : "Unknown error"}
        onRetry={() => refetch()}
      />
    );
  }

  // No data (shouldn't happen but safety)
  if (!research) {
    return <LoadingSkeleton ticker={activeTicker} />;
  }

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
  const verdictColor = getVerdictColor(research.verdict);

  return (
    <div
      className="h-full overflow-auto p-3 space-y-4 text-xs terminal-scrollbar"
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
          <span
            className="font-bold"
            style={{ color: verdictColor, fontSize: "12px" }}
          >
            {research.verdict}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="px-1.5 py-0.5 text-xs font-bold"
              style={{
                background: confColor,
                color: "#0a0e14",
                fontSize: "10px",
              }}
            >
              {confLabel}
            </span>
            <span style={{ color: "#7a8a9e", fontSize: "10px" }}>
              ({research.confidence}%)
            </span>
          </span>
        </div>
        <span style={{ fontSize: "10px", color: "#7a8a9e" }}>
          {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
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
      {research.bullCase.length > 0 && (
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
      )}

      {/* BEAR CASE */}
      {research.bearCase.length > 0 && (
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
      )}

      {/* KEY LEVELS */}
      {keyLevels.current > 0 && (
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
            <div
              className="flex justify-between mt-2"
              style={{ fontSize: "10px" }}
            >
              <div className="text-left">
                <div style={{ color: "#7a8a9e" }}>52W Low</div>
                <div style={{ color: "#e8edf3" }}>
                  ${keyLevels.low52w.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div style={{ color: "#00d4aa" }}>Support</div>
                <div style={{ color: "#e8edf3" }}>
                  ${keyLevels.support.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div style={{ color: "#ff8c00" }}>Current</div>
                <div style={{ color: "#e8edf3" }}>
                  ${keyLevels.current.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div style={{ color: "#ff4757" }}>Resistance</div>
                <div style={{ color: "#e8edf3" }}>
                  ${keyLevels.resistance.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div style={{ color: "#7a8a9e" }}>52W High</div>
                <div style={{ color: "#e8edf3" }}>
                  ${keyLevels.high52w.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATALYSTS */}
      {research.catalysts.length > 0 && (
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
      )}

      {/* Regenerate button */}
      <div className="pt-2">
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-3 py-1.5 text-xs cursor-pointer transition-colors"
          style={{
            border: "1px solid #2a3545",
            background: isFetching ? "#1a2130" : "transparent",
            color: isFetching ? "#7a8a9e" : "#7a8a9e",
            borderRadius: "0px",
            opacity: isFetching ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isFetching) {
              (e.target as HTMLButtonElement).style.color = "#e8edf3";
              (e.target as HTMLButtonElement).style.borderColor = "#7a8a9e";
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.color = "#7a8a9e";
            (e.target as HTMLButtonElement).style.borderColor = "#2a3545";
          }}
        >
          {isFetching ? "Generating..." : "Regenerate"}
        </button>
      </div>
    </div>
  );
}
