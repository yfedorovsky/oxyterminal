"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAtom } from "jotai";
import {
  useETradeAccounts,
  useETradePositions,
  useETradeBalance,
} from "@/lib/hooks";
import { activeTickerAtom } from "../atoms";

// ─── Types ────────────────────────────────────────────────────────────────

interface Position {
  symbol: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  dayChange: number;
  dayChangePct: number;
  totalGain: number;
  totalGainPct: number;
  positionType: string;
}

interface Account {
  accountId: string;
  accountIdKey: string;
  accountType: string;
  accountDesc: string;
}

interface Balance {
  accountId: string;
  accountType: string;
  totalAccountValue: number;
  cashBalance: number;
  buyingPower: number;
  dayTradeBalance: number;
  netCash: number;
}

type AuthStep = "disconnected" | "authorizing" | "connected";
type SortKey = "symbol" | "quantity" | "costBasis" | "currentPrice" | "dayChangePct" | "totalGain" | "totalGainPct";
type SortDir = "asc" | "desc";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return "$" + (val / 1_000_000).toFixed(2) + "M";
  }
  if (Math.abs(val) >= 1_000) {
    return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return "$" + val.toFixed(2);
}

function formatPct(val: number): string {
  const prefix = val > 0 ? "+" : "";
  return prefix + val.toFixed(2) + "%";
}

function formatChange(val: number): string {
  const prefix = val > 0 ? "+" : "";
  return prefix + "$" + Math.abs(val).toFixed(2);
}

// ─── Disconnected State ──────────────────────────────────────────────────

function DisconnectedView({
  onConnect,
}: {
  onConnect: () => void;
}) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4"
      style={{ background: "#0a0e14", padding: "24px" }}
    >
      <div
        style={{
          color: "#7a8a9e",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
        }}
      >
        Connect E*TRADE Account
      </div>
      <div
        style={{
          color: "#4a5568",
          fontSize: "11px",
          textAlign: "center",
          maxWidth: "280px",
          lineHeight: "1.5",
        }}
      >
        Link your E*TRADE brokerage account to view live portfolio positions,
        balances, and P&L directly in the terminal.
      </div>
      <button
        onClick={onConnect}
        style={{
          background: "#1a2130",
          border: "1px solid #2a3545",
          color: "#4fc3f7",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', monospace",
          padding: "8px 20px",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderRadius: "0px",
        }}
      >
        Connect E*TRADE
      </button>
    </div>
  );
}

// ─── Authorizing State ───────────────────────────────────────────────────

function AuthorizingView({
  authorizeUrl,
  requestToken,
  onAuthorize,
  onCancel,
  isLoading,
  error,
}: {
  authorizeUrl: string;
  requestToken: string;
  onAuthorize: (verifier: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [verifier, setVerifier] = useState("");

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3"
      style={{ background: "#0a0e14", padding: "24px" }}
    >
      <div
        style={{
          color: "#ff8c00",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
        }}
      >
        Authorize E*TRADE
      </div>

      <div
        style={{
          color: "#7a8a9e",
          fontSize: "10px",
          textAlign: "center",
          maxWidth: "300px",
          lineHeight: "1.6",
        }}
      >
        1. Click below to open E*TRADE authorization page
        <br />
        2. Log in and authorize the app
        <br />
        3. Copy the verifier code and paste it below
      </div>

      <a
        href={authorizeUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: "#1a2130",
          border: "1px solid #ff8c00",
          color: "#ff8c00",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', monospace",
          padding: "6px 16px",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          textDecoration: "none",
          display: "inline-block",
          borderRadius: "0px",
        }}
      >
        Open E*TRADE Auth
      </a>

      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          type="text"
          value={verifier}
          onChange={(e) => setVerifier(e.target.value)}
          placeholder="Paste verifier code"
          style={{
            background: "#111820",
            border: "1px solid #2a3545",
            color: "#e8edf3",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            padding: "6px 10px",
            width: "180px",
            outline: "none",
            borderRadius: "0px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && verifier.trim()) {
              onAuthorize(verifier.trim());
            }
          }}
        />
        <button
          onClick={() => verifier.trim() && onAuthorize(verifier.trim())}
          disabled={!verifier.trim() || isLoading}
          style={{
            background: verifier.trim() ? "#1a2130" : "#111820",
            border: `1px solid ${verifier.trim() ? "#00d4aa" : "#2a3545"}`,
            color: verifier.trim() ? "#00d4aa" : "#4a5568",
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            padding: "6px 12px",
            cursor: verifier.trim() ? "pointer" : "default",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderRadius: "0px",
          }}
        >
          {isLoading ? "..." : "Authorize"}
        </button>
      </div>

      {error && (
        <div style={{ color: "#ff4757", fontSize: "10px", maxWidth: "280px", textAlign: "center" }}>
          {error}
        </div>
      )}

      <button
        onClick={onCancel}
        style={{
          background: "none",
          border: "none",
          color: "#4a5568",
          fontSize: "10px",
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          padding: "4px 8px",
        }}
      >
        Cancel
      </button>

      {/* Hidden token reference for debugging */}
      <div style={{ color: "#2a3545", fontSize: "8px" }}>
        token: {requestToken.slice(0, 8)}...
      </div>
    </div>
  );
}

// ─── Column Definitions ──────────────────────────────────────────────────

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "symbol", label: "Ticker", align: "left" },
  { key: "quantity", label: "Qty", align: "right" },
  { key: "costBasis", label: "Avg Cost", align: "right" },
  { key: "currentPrice", label: "Current", align: "right" },
  { key: "dayChangePct", label: "Day Chg%", align: "right" },
  { key: "totalGain", label: "Total P&L", align: "right" },
  { key: "totalGainPct", label: "P&L%", align: "right" },
];

// ─── Connected State ─────────────────────────────────────────────────────

function ConnectedView() {
  const [, setActiveTicker] = useAtom(activeTickerAtom);
  const [sortKey, setSortKey] = useState<SortKey>("totalGainPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);

  const { data: accounts } = useETradeAccounts();

  const typedAccounts = useMemo(() => {
    if (!Array.isArray(accounts)) return [] as Account[];
    return accounts as Account[];
  }, [accounts]);

  // Auto-select: use last account (usually the funded one), unless user picked one
  const activeIdx = selectedIdx >= 0 ? selectedIdx : Math.max(0, typedAccounts.length - 1);
  const activeAccount = typedAccounts[activeIdx] || null;
  const accountIdKey = activeAccount?.accountIdKey || "";

  const { data: positions, isLoading: posLoading } = useETradePositions(accountIdKey);
  const { data: balance } = useETradeBalance(accountIdKey);

  const typedPositions = (positions || []) as Position[];
  const typedBalance = balance as Balance | null;

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "symbol" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  const sortedPositions = useMemo(() => {
    return [...typedPositions].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = aVal as number;
      const bNum = bVal as number;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [typedPositions, sortKey, sortDir]);

  // Compute portfolio-level daily P&L
  const dailyPnl = useMemo(() => {
    return typedPositions.reduce((sum, p) => sum + p.dayChange * p.quantity, 0);
  }, [typedPositions]);

  const totalValue = typedBalance?.totalAccountValue || 0;

  return (
    <div className="flex h-full flex-col" style={{ background: "#0a0e14" }}>
      {/* Account tabs (only show if multiple accounts) */}
      {typedAccounts.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "0px",
            borderBottom: "1px solid #2a3545",
            background: "#111820",
          }}
        >
          {typedAccounts.map((acct, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={acct.accountIdKey}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  background: isActive ? "#1a2130" : "transparent",
                  border: "none",
                  borderBottom: isActive ? "2px solid #4fc3f7" : "2px solid transparent",
                  color: isActive ? "#e8edf3" : "#4a5568",
                  fontSize: "9px",
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: "5px 10px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {acct.accountDesc || acct.accountType}
                <span style={{ color: "#3a4553", marginLeft: "4px", fontSize: "8px" }}>
                  ···{acct.accountId.slice(-4)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Portfolio summary banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 10px",
          background: "#111820",
          borderBottom: "1px solid #2a3545",
          minHeight: "28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <span
            style={{
              color: "#e8edf3",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {totalValue > 0 ? formatCurrency(totalValue) : "--"}
          </span>
          {dailyPnl !== 0 && (
            <span
              style={{
                color: dailyPnl >= 0 ? "#00d4aa" : "#ff4757",
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {formatChange(dailyPnl)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {typedBalance && (
            <>
              <span style={{ color: "#7a8a9e", fontSize: "9px" }}>
                CASH{" "}
                <span style={{ color: "#e8edf3" }}>
                  {formatCurrency(typedBalance.cashBalance)}
                </span>
              </span>
              <span style={{ color: "#7a8a9e", fontSize: "9px" }}>
                BP{" "}
                <span style={{ color: "#e8edf3" }}>
                  {formatCurrency(typedBalance.buyingPower)}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Positions table */}
      <div className="flex-1 overflow-auto">
        {posLoading && typedPositions.length === 0 ? (
          <div
            className="flex h-full items-center justify-center"
            style={{ color: "#3a4553", fontSize: "11px" }}
          >
            Loading positions...
          </div>
        ) : typedPositions.length === 0 ? (
          <div
            className="flex h-full items-center justify-center"
            style={{ color: "#4a5568", fontSize: "11px" }}
          >
            No positions found
          </div>
        ) : (
          <table
            className="w-full border-collapse text-xs"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="sticky top-0 z-10 cursor-pointer select-none px-2 py-1 font-normal uppercase tracking-wide"
                    style={{
                      fontSize: "10px",
                      color: sortKey === col.key ? "#e8edf3" : "#7a8a9e",
                      background: "#111820",
                      textAlign: col.align,
                      borderBottom: "1px solid #2a3545",
                    }}
                  >
                    <span
                      className="flex items-center gap-1"
                      style={{
                        justifyContent:
                          col.align === "right" ? "flex-end" : "flex-start",
                      }}
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span>{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPositions.map((pos, idx) => {
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? "#111820" : "#151d2a";
                const dayColor = pos.dayChangePct >= 0 ? "#00d4aa" : "#ff4757";
                const pnlColor = pos.totalGain >= 0 ? "#00d4aa" : "#ff4757";

                return (
                  <tr
                    key={pos.symbol}
                    onClick={() => setActiveTicker(pos.symbol)}
                    className="cursor-pointer transition-colors hover:brightness-110"
                    style={{ background: rowBg, height: "24px" }}
                  >
                    <td
                      className="px-2 py-0.5"
                      style={{
                        color: "#e8edf3",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      {pos.symbol}
                      {pos.positionType === "SHORT" && (
                        <span
                          style={{
                            color: "#ff4757",
                            fontSize: "8px",
                            marginLeft: "3px",
                          }}
                        >
                          S
                        </span>
                      )}
                    </td>
                    <td
                      className="px-2 py-0.5"
                      style={{ color: "#e8edf3", textAlign: "right" }}
                    >
                      {pos.quantity}
                    </td>
                    <td
                      className="px-2 py-0.5"
                      style={{ color: "#7a8a9e", textAlign: "right" }}
                    >
                      ${pos.costBasis.toFixed(2)}
                    </td>
                    <td
                      className="px-2 py-0.5"
                      style={{ color: "#e8edf3", textAlign: "right" }}
                    >
                      ${pos.currentPrice.toFixed(2)}
                    </td>
                    <td
                      className="px-2 py-0.5"
                      style={{ color: dayColor, textAlign: "right" }}
                    >
                      {formatPct(pos.dayChangePct)}
                    </td>
                    <td
                      className="px-2 py-0.5"
                      style={{ color: pnlColor, textAlign: "right" }}
                    >
                      {formatChange(pos.totalGain)}
                    </td>
                    <td
                      className="px-2 py-0.5"
                      style={{
                        color: pnlColor,
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {formatPct(pos.totalGainPct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function Portfolio() {
  const [authStep, setAuthStep] = useState<AuthStep>("disconnected");
  const [authorizeUrl, setAuthorizeUrl] = useState("");
  const [requestToken, setRequestToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // On mount, check if we already have valid tokens (from mirbot cache or disk)
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/etrade/status");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAuthStep("connected");
          }
        }
      } catch {
        // ignore — just stay disconnected
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, []);

  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/etrade/auth");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start OAuth flow");
      }
      const data = await res.json();
      setAuthorizeUrl(data.authorizeUrl);
      setRequestToken(data.requestToken);
      setAuthStep("authorizing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthorize = useCallback(
    async (verifier: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/etrade/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestToken, verifier }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Authorization failed");
        }
        setAuthStep("connected");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authorization failed");
      } finally {
        setIsLoading(false);
      }
    },
    [requestToken]
  );

  const handleCancel = useCallback(() => {
    setAuthStep("disconnected");
    setAuthorizeUrl("");
    setRequestToken("");
    setError(null);
  }, []);

  // Show brief loading while checking auth status
  if (checking) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ background: "#0a0e14", color: "#3a4553", fontSize: "11px" }}
      >
        Checking E*TRADE connection...
      </div>
    );
  }

  switch (authStep) {
    case "disconnected":
      return <DisconnectedView onConnect={handleConnect} />;
    case "authorizing":
      return (
        <AuthorizingView
          authorizeUrl={authorizeUrl}
          requestToken={requestToken}
          onAuthorize={handleAuthorize}
          onCancel={handleCancel}
          isLoading={isLoading}
          error={error}
        />
      );
    case "connected":
      return <ConnectedView />;
  }
}
