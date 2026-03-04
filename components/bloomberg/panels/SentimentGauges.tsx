"use client";

import { sentimentData } from "@/lib/mock-data";

function getSignalColor(signal: string): string {
  const s = signal.toUpperCase();
  if (s.includes("BUY")) return "#00d4aa";
  if (s.includes("SELL")) return "#ff4757";
  return "#ff8c00";
}

function getFearGreedColor(value: number): string {
  if (value <= 20) return "#ff4757";
  if (value <= 40) return "#ff8c00";
  if (value <= 60) return "#7a8a9e";
  if (value <= 80) return "#00d4aa";
  return "#00d4aa";
}

function getVixColor(value: number): string {
  if (value < 15) return "#00d4aa";
  if (value <= 25) return "#ff8c00";
  return "#ff4757";
}

const GAUGE_SEGMENTS = [
  { label: "EXTR FEAR", color: "#ff4757" },
  { label: "FEAR", color: "#ff6b6b" },
  { label: "NEUTRAL", color: "#7a8a9e" },
  { label: "GREED", color: "#66d4aa" },
  { label: "EXTR GREED", color: "#00d4aa" },
];

const SUB_INDICATORS: { key: keyof typeof sentimentData.subIndicators; label: string }[] = [
  { key: "momentum", label: "MOMENTUM" },
  { key: "priceStrength", label: "PRICE STRENGTH" },
  { key: "breadth", label: "BREADTH" },
  { key: "putCall", label: "PUT/CALL" },
  { key: "vix", label: "VIX" },
  { key: "junkBond", label: "JUNK BOND" },
  { key: "safeHaven", label: "SAFE HAVEN" },
];

function SubIndicatorBar({ label, value }: { label: string; value: number }) {
  const barColor = value <= 25 ? "#ff4757" : value <= 50 ? "#ff8c00" : value <= 75 ? "#7a8a9e" : "#00d4aa";
  return (
    <div className="flex items-center gap-2 py-0.5" style={{ fontSize: "10px" }}>
      <span className="w-28 shrink-0 text-right" style={{ color: "#ff8c00" }}>
        {label}
      </span>
      <div className="flex-1 h-2 relative" style={{ background: "#1a2130" }}>
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${value}%`, background: barColor }}
        />
      </div>
      <span className="w-8 text-right tabular-nums" style={{ color: "#e8edf3" }}>
        {value}
      </span>
    </div>
  );
}

export default function SentimentGauges() {
  const data = sentimentData;
  const markerPosition = (data.fearGreedIndex.value / 100) * 100;
  const spreadColor = data.aaiiBullBearSpread >= 0 ? "#00d4aa" : "#ff4757";
  const spreadPrefix = data.aaiiBullBearSpread >= 0 ? "+" : "";
  const vixColor = getVixColor(data.vix);
  const totalSentiment = data.bullPct + data.bearPct + data.neutralPct;
  const bullWidth = (data.bullPct / totalSentiment) * 100;
  const bearWidth = (data.bearPct / totalSentiment) * 100;

  return (
    <div
      className="h-full overflow-auto p-3 space-y-0"
      style={{ background: "#0d1117", fontVariantNumeric: "tabular-nums" }}
    >
      {/* Overall Signal Banner */}
      <div
        className="pb-3 mb-3"
        style={{ borderBottom: "1px dashed #2a3545" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-lg font-bold tracking-wider"
              style={{ color: getSignalColor(data.overallSignal.signal) }}
            >
              {data.overallSignal.signal}
            </div>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "#7a8a9e", maxWidth: "480px" }}>
              {data.overallSignal.explanation}
            </p>
          </div>
          <div className="shrink-0 text-right" style={{ fontSize: "10px", color: "#7a8a9e" }}>
            2026-03-03
          </div>
        </div>
      </div>

      {/* Fear & Greed Card */}
      <div
        className="pb-3 mb-3"
        style={{ borderBottom: "1px dashed #2a3545" }}
      >
        <div className="text-center mb-2">
          <div
            className="font-bold"
            style={{
              fontSize: "32px",
              color: getFearGreedColor(data.fearGreedIndex.value),
              lineHeight: 1.1,
            }}
          >
            {data.fearGreedIndex.value}
          </div>
          <div
            className="mt-1 font-semibold tracking-wider"
            style={{ fontSize: "11px", color: "#ff8c00" }}
          >
            {data.fearGreedIndex.reading}
          </div>
        </div>

        {/* Gauge bar */}
        <div className="relative mt-3 mb-1">
          <div className="flex h-3 overflow-hidden">
            {GAUGE_SEGMENTS.map((seg, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  background: seg.color,
                  opacity: 0.7,
                  borderRight: i < GAUGE_SEGMENTS.length - 1 ? "1px solid #0d1117" : undefined,
                }}
              />
            ))}
          </div>
          {/* Marker */}
          <div
            className="absolute top-0"
            style={{
              left: `${markerPosition}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "6px solid #e8edf3",
              }}
            />
          </div>
        </div>
        <div className="flex justify-between" style={{ fontSize: "8px", color: "#7a8a9e" }}>
          {GAUGE_SEGMENTS.map((seg, i) => (
            <span key={i} className="flex-1 text-center">
              {seg.label}
            </span>
          ))}
        </div>

        {/* Sub-indicators */}
        <div className="mt-3 space-y-0">
          {SUB_INDICATORS.map((ind) => (
            <SubIndicatorBar
              key={ind.key}
              label={ind.label}
              value={data.subIndicators[ind.key]}
            />
          ))}
        </div>
      </div>

      {/* AAII Sentiment Card */}
      <div
        className="pb-3 mb-3"
        style={{ borderBottom: "1px dashed #2a3545" }}
      >
        <div className="text-center mb-2">
          <div
            className="font-bold"
            style={{ fontSize: "28px", color: spreadColor, lineHeight: 1.1 }}
          >
            {spreadPrefix}{data.aaiiBullBearSpread.toFixed(1)}%
          </div>
          <div
            className="mt-1 font-semibold tracking-wider"
            style={{ fontSize: "10px", color: "#ff8c00" }}
          >
            BULL-BEAR SPREAD
          </div>
        </div>

        <div
          className="flex justify-center gap-6 mt-2 mb-2"
          style={{ fontSize: "10px" }}
        >
          <div className="text-center">
            <span style={{ color: "#7a8a9e" }}>Bull </span>
            <span style={{ color: "#00d4aa" }}>{data.bullPct}%</span>
          </div>
          <div className="text-center">
            <span style={{ color: "#7a8a9e" }}>Bear </span>
            <span style={{ color: "#ff4757" }}>{data.bearPct}%</span>
          </div>
          <div className="text-center">
            <span style={{ color: "#7a8a9e" }}>Neutral </span>
            <span style={{ color: "#e8edf3" }}>{data.neutralPct}%</span>
          </div>
        </div>

        {/* Sentiment gauge bar */}
        <div className="flex h-2 overflow-hidden" style={{ background: "#1a2130" }}>
          <div style={{ width: `${bearWidth}%`, background: "#ff4757" }} />
          <div style={{ width: `${100 - bullWidth - bearWidth}%`, background: "#7a8a9e", opacity: 0.4 }} />
          <div style={{ width: `${bullWidth}%`, background: "#00d4aa" }} />
        </div>
      </div>

      {/* VIX Card */}
      <div className="pb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div
              className="font-bold"
              style={{ fontSize: "28px", color: vixColor, lineHeight: 1.1 }}
            >
              {data.vix.toFixed(1)}
            </div>
            {data.vix > 30 && (
              <span
                className="inline-block h-2.5 w-2.5 animate-pulse"
                style={{ background: "#ff4757", borderRadius: "50%" }}
              />
            )}
          </div>
          <div
            className="mt-1 font-semibold tracking-wider"
            style={{ fontSize: "10px", color: "#ff8c00" }}
          >
            CBOE VOLATILITY INDEX
          </div>
        </div>
      </div>
    </div>
  );
}
