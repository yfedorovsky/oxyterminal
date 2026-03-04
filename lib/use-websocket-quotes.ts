"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TradeData {
  price: number;
  timestamp: number;
  volume: number;
}

/**
 * Finnhub WebSocket hook for real-time trade streaming.
 *
 * Only activates when the `NEXT_PUBLIC_FINNHUB_WS_KEY` env var is set.
 * REST polling (useQuotes) remains the baseline data source; this hook
 * provides faster price updates that are merged on top.
 *
 * @param symbols  Array of ticker symbols to subscribe to
 * @param enabled  Whether the WebSocket should be active (default true)
 */
export function useFinnhubWebSocket(
  symbols: string[],
  enabled: boolean = true,
) {
  const [trades, setTrades] = useState<Map<string, TradeData>>(new Map());
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const subscribedRef = useRef<Set<string>>(new Set());
  const symbolsRef = useRef(symbols);

  // Keep track of current symbols so the onopen handler always sees the
  // latest list without triggering a reconnect.
  symbolsRef.current = symbols;

  const wsKey =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_FINNHUB_WS_KEY
      : undefined;

  const connect = useCallback(() => {
    if (!wsKey || !enabled) return;

    const ws = new WebSocket(`wss://ws.finnhub.io?token=${wsKey}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setConnected(true);

      // Subscribe to all current symbols
      for (const symbol of symbolsRef.current) {
        if (!subscribedRef.current.has(symbol)) {
          ws.send(JSON.stringify({ type: "subscribe", symbol }));
          subscribedRef.current.add(symbol);
        }
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "trade" && Array.isArray(msg.data)) {
          setTrades((prev) => {
            const next = new Map(prev);
            for (const trade of msg.data) {
              // Only keep the most recent trade per symbol
              const existing = next.get(trade.s);
              if (!existing || trade.t >= existing.timestamp) {
                next.set(trade.s, {
                  price: trade.p,
                  timestamp: trade.t,
                  volume: trade.v,
                });
              }
            }
            return next;
          });
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      subscribedRef.current.clear();
      setConnected(false);

      // Exponential backoff: 1s, 2s, 4s, 8s, ... capped at 30s
      const delay = Math.min(
        1000 * 2 ** reconnectAttemptsRef.current,
        30_000,
      );
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose will fire after onerror, triggering reconnection
      ws.close();
    };
  }, [wsKey, enabled]);

  // Connect on mount, clean up on unmount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Handle symbol subscription changes while connected
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const currentSymbols = new Set(symbols);

    // Subscribe to newly added symbols
    for (const symbol of symbols) {
      if (!subscribedRef.current.has(symbol)) {
        ws.send(JSON.stringify({ type: "subscribe", symbol }));
        subscribedRef.current.add(symbol);
      }
    }

    // Unsubscribe from removed symbols
    for (const symbol of subscribedRef.current) {
      if (!currentSymbols.has(symbol)) {
        ws.send(JSON.stringify({ type: "unsubscribe", symbol }));
        subscribedRef.current.delete(symbol);
      }
    }
  }, [symbols]);

  return {
    /** Map of symbol -> latest trade data from WebSocket */
    trades,
    /** Whether the WebSocket is currently connected */
    isConnected: connected,
    /** Whether the NEXT_PUBLIC_FINNHUB_WS_KEY env var is set */
    isAvailable: !!wsKey,
  };
}
