"use client";

import { useAtom } from "jotai";
import { activeTickerAtom } from "../atoms";
import { useCompanyProfile, useCompanyDescription } from "@/lib/hooks";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatMarketCap(val: number): string {
  if (!val) return "--";
  if (val >= 1_000) return (val / 1_000).toFixed(2) + "T";
  if (val >= 1) return val.toFixed(2) + "B";
  return (val * 1_000).toFixed(1) + "M";
}

function formatShares(val: number): string {
  if (!val) return "--";
  if (val >= 1_000) return (val / 1_000).toFixed(2) + "B";
  return val.toFixed(1) + "M";
}

// ─── Stat Item ────────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        background: "#1a2130",
        border: "1px solid #2a3545",
        borderRadius: "0px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: "#7a8a9e",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "3px",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#e8edf3",
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function Description() {
  const [activeTicker] = useAtom(activeTickerAtom);
  const { data: profile, isLoading: profileLoading } = useCompanyProfile(activeTicker);
  const { data: description, isLoading: descLoading } = useCompanyDescription(activeTicker);

  const isLoading = profileLoading || descLoading;

  if (isLoading) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          background: "#0a0e14",
          color: "#3a4553",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Loading company profile...
      </div>
    );
  }

  if (!profile || !profile.name) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          background: "#0a0e14",
          color: "#4a5568",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        No profile data for {activeTicker}
      </div>
    );
  }

  const {
    name,
    ticker,
    finnhubIndustry,
    exchange,
    marketCapitalization,
    shareOutstanding,
    ipo,
    currency,
    country,
    weburl,
    logo,
    phone,
  } = profile;

  return (
    <div
      className="h-full overflow-auto terminal-scrollbar"
      style={{
        background: "#0a0e14",
        padding: "12px",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Header: Logo + Name + Ticker Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        {logo && (
          <img
            src={logo}
            alt={`${name} logo`}
            style={{
              width: "28px",
              height: "28px",
              objectFit: "contain",
              background: "#111820",
              border: "1px solid #2a3545",
              padding: "2px",
              borderRadius: "0px",
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#e8edf3",
                lineHeight: 1.2,
              }}
            >
              {name}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#0a0e14",
                background: "#ff8c00",
                padding: "1px 6px",
                letterSpacing: "0.5px",
                borderRadius: "0px",
              }}
            >
              {ticker || activeTicker}
            </span>
          </div>
        </div>
      </div>

      {/* Sector / Industry / Exchange row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        {finnhubIndustry && (
          <span
            style={{
              fontSize: "10px",
              color: "#7a8a9e",
            }}
          >
            {finnhubIndustry}
          </span>
        )}
        {finnhubIndustry && exchange && (
          <span style={{ fontSize: "10px", color: "#2a3545" }}>&middot;</span>
        )}
        {exchange && (
          <span
            style={{
              fontSize: "10px",
              color: "#7a8a9e",
            }}
          >
            {exchange}
          </span>
        )}
      </div>

      {/* Key Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          marginBottom: "12px",
        }}
      >
        <StatItem
          label="Market Cap"
          value={formatMarketCap(marketCapitalization)}
        />
        <StatItem
          label="Shares Out"
          value={formatShares(shareOutstanding)}
        />
        <StatItem
          label="IPO Date"
          value={ipo || "--"}
        />
        <StatItem
          label="Currency"
          value={currency || "--"}
        />
        <StatItem
          label="Country"
          value={country || "--"}
        />
        {phone && (
          <StatItem
            label="Phone"
            value={phone}
          />
        )}
      </div>

      {/* Website link */}
      {weburl && (
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "9px",
              color: "#7a8a9e",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "3px",
            }}
          >
            Website
          </div>
          <a
            href={weburl.startsWith("http") ? weburl : `https://${weburl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "11px",
              color: "#4fc3f7",
              textDecoration: "none",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {weburl.replace(/^https?:\/\//, "")}
          </a>
        </div>
      )}

      {/* Company Description */}
      {description && (
        <div>
          <div
            style={{
              fontSize: "9px",
              color: "#ff8c00",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "4px",
            }}
          >
            About
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#7a8a9e",
              lineHeight: 1.6,
            }}
          >
            {description}
          </div>
        </div>
      )}
    </div>
  );
}
