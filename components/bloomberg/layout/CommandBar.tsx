"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  activeTickerAtom,
  commandBarOpenAtom,
  commandHistoryAtom,
  activeCommandAtom,
  showHelpAtom,
  flexPanelAtom,
} from "../atoms";
import { parseCommand, getCommandSuggestions } from "@/lib/commands";

// Known standalone command keywords — skip FMP search when input matches exactly
const KNOWN_COMMANDS = new Set([
  "HELP", "?", "MOST", "EARN", "BUZZ", "FEAR", "SENTIMENT",
  "STATS", "BRIEF", "WL", "SET", "CLEAR", "SECTOR",
  "PORT", "PORTFOLIO",
]);

interface TickerResult {
  symbol: string;
  name: string;
  exchangeShortName: string;
}

export default function CommandBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [commandBarOpen, setCommandBarOpen] = useAtom(commandBarOpenAtom);
  const [, setActiveCommand] = useAtom(activeCommandAtom);
  const [commandHistory, setCommandHistory] = useAtom(commandHistoryAtom);
  const setActiveTicker = useSetAtom(activeTickerAtom);
  const setShowHelp = useSetAtom(showHelpAtom);
  const setFlexPanel = useSetAtom(flexPanelAtom);

  const [inputValue, setInputValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<
    Array<{ command: string; description: string }>
  >([]);
  const [tickerResults, setTickerResults] = useState<TickerResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce timer ref for ticker search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the latest search query to avoid stale responses
  const latestQueryRef = useRef("");

  // Total navigable items: command suggestions + ticker results
  const totalItems = suggestions.length + tickerResults.length;

  // Update command suggestions (instant/local) as user types
  useEffect(() => {
    if (inputValue.trim()) {
      const results = getCommandSuggestions(inputValue);
      setSuggestions(results);
      setSelectedIndex(0);
      setShowDropdown(results.length > 0);
    } else {
      setSuggestions([]);
      setTickerResults([]);
      setShowDropdown(false);
    }
  }, [inputValue]);

  // Debounced FMP ticker search
  useEffect(() => {
    const trimmed = inputValue.trim();
    const normalized = trimmed.toUpperCase();

    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    // Don't search if empty, or if it exactly matches a known command keyword
    if (!trimmed || trimmed.length < 1 || KNOWN_COMMANDS.has(normalized)) {
      setTickerResults([]);
      return;
    }

    // Don't search if the input has a space followed by a known sub-command
    // (e.g. "AAPL G", "MSFT NEWS") — these are command patterns, not ticker searches
    const parts = normalized.split(/\s+/);
    if (parts.length > 1) {
      const subCmd = parts[parts.length - 1];
      const knownSubCommands = new Set(["G", "CHART", "DES", "FA", "OPT", "N", "NEWS", "HDS", "AI"]);
      if (knownSubCommands.has(subCmd)) {
        setTickerResults([]);
        return;
      }
    }

    latestQueryRef.current = trimmed;

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/fmp/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) {
          setTickerResults([]);
          return;
        }
        const data = await res.json();
        // Only update if this is still the latest query
        if (latestQueryRef.current === trimmed && Array.isArray(data)) {
          const results: TickerResult[] = data.slice(0, 6).map(
            (item: { symbol: string; name: string; exchangeShortName: string }) => ({
              symbol: item.symbol,
              name: item.name,
              exchangeShortName: item.exchangeShortName,
            })
          );
          setTickerResults(results);
          // Show dropdown if we have any results (commands or tickers)
          if (results.length > 0) {
            setShowDropdown(true);
          }
        }
      } catch {
        setTickerResults([]);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [inputValue]);

  // Global backtick listener to focus the input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        const target = e.target as HTMLElement;
        if (target === inputRef.current) return;

        e.preventDefault();
        inputRef.current?.focus();
        setCommandBarOpen(true);
      }

      if (e.key === "?" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setCommandBarOpen, setShowHelp]);

  const executeCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const command = parseCommand(trimmed);

      // Add to history
      setCommandHistory((prev) => [trimmed, ...prev]);
      setActiveCommand(trimmed);

      // If the command resolved a ticker, update the active ticker
      if (command.ticker) {
        setActiveTicker(command.ticker);
      }

      // If the command is help, open the help overlay
      if (command.type === "help") {
        setShowHelp(true);
      }

      // Swap the flexible bottom-left panel based on command type
      switch (command.type) {
        case "description":
          setFlexPanel("description");
          break;
        case "financials":
          setFlexPanel("financials");
          break;
        case "movers":
          setFlexPanel("most-active");
          break;
        case "options":
          setFlexPanel("options-chain");
          break;
      }

      // Clear input
      setInputValue("");
      setHistoryIndex(-1);
      setShowDropdown(false);
      setTickerResults([]);
    },
    [setCommandHistory, setActiveCommand, setActiveTicker, setShowHelp, setFlexPanel]
  );

  // Select a ticker from search results: set it as active ticker
  const selectTicker = useCallback(
    (symbol: string) => {
      const upper = symbol.toUpperCase();
      setActiveTicker(upper);
      setCommandHistory((prev) => [upper, ...prev]);
      setActiveCommand(upper);
      setInputValue("");
      setHistoryIndex(-1);
      setShowDropdown(false);
      setTickerResults([]);
    },
    [setActiveTicker, setCommandHistory, setActiveCommand]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      inputRef.current?.blur();
      setCommandBarOpen(false);
      setShowDropdown(false);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown && totalItems > 0) {
        if (selectedIndex < suggestions.length) {
          // Selected a command suggestion
          const selected = suggestions[selectedIndex];
          if (selected) {
            executeCommand(selected.command);
            return;
          }
        } else {
          // Selected a ticker result
          const tickerIdx = selectedIndex - suggestions.length;
          const ticker = tickerResults[tickerIdx];
          if (ticker) {
            selectTicker(ticker.symbol);
            return;
          }
        }
      }
      executeCommand(inputValue);
      return;
    }

    // Backtick inside input: just ignore it (don't type it, don't refocus)
    if (e.key === "`") {
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showDropdown && totalItems > 0) {
        setSelectedIndex((prev) =>
          prev <= 0 ? totalItems - 1 : prev - 1
        );
      } else if (commandHistory.length > 0) {
        const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showDropdown && totalItems > 0) {
        setSelectedIndex((prev) =>
          prev >= totalItems - 1 ? 0 : prev + 1
        );
      } else if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue("");
      }
      return;
    }

    // Tab to autocomplete selected item
    if (e.key === "Tab" && showDropdown && totalItems > 0) {
      e.preventDefault();
      if (selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex];
        if (selected) {
          setInputValue(selected.command);
          setShowDropdown(false);
        }
      } else {
        const tickerIdx = selectedIndex - suggestions.length;
        const ticker = tickerResults[tickerIdx];
        if (ticker) {
          setInputValue(ticker.symbol);
          setShowDropdown(false);
        }
      }
    }
  };

  const hasAnySuggestions = suggestions.length > 0 || tickerResults.length > 0;

  return (
    <div className="relative" style={{ zIndex: 100 }}>
      {/* Command bar */}
      <div
        className="flex items-center w-full px-3"
        style={{
          height: 36,
          backgroundColor: "var(--terminal-surface)",
          borderBottom: "1px solid var(--terminal-border)",
        }}
      >
        {/* Prompt */}
        <span
          className="font-mono text-xs font-semibold mr-2 select-none shrink-0"
          style={{ color: "var(--terminal-orange)" }}
        >
          OXY&gt;
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setHistoryIndex(-1);
          }}
          onFocus={() => setCommandBarOpen(true)}
          onBlur={() => {
            // Delay to allow click on suggestions
            setTimeout(() => {
              setShowDropdown(false);
              setCommandBarOpen(false);
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder="` to open terminal"
          className="flex-1 font-mono text-xs bg-transparent outline-none border-none"
          style={{
            color: "var(--terminal-text)",
            caretColor: "var(--terminal-orange)",
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />

        {/* Active ticker badge */}
        <ActiveTickerBadge />
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && hasAnySuggestions && (
        <div
          className="absolute left-0 right-0 overflow-y-auto terminal-scrollbar"
          style={{
            top: 36,
            maxHeight: 340,
            backgroundColor: "var(--terminal-card)",
            border: "1px solid var(--terminal-border)",
            borderTop: "none",
            zIndex: 101,
          }}
        >
          {/* Command suggestions section */}
          {suggestions.length > 0 && (
            <div>
              <div
                className="px-3 py-1 font-mono select-none"
                style={{
                  fontSize: 10,
                  color: "var(--terminal-text-secondary)",
                  letterSpacing: "0.05em",
                }}
              >
                COMMANDS
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.command}
                  className="flex items-center w-full px-3 py-1.5 text-left font-mono text-xs"
                  style={{
                    backgroundColor:
                      index === selectedIndex
                        ? "var(--terminal-border)"
                        : "transparent",
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeCommand(suggestion.command);
                  }}
                >
                  <span
                    className="font-semibold mr-3 shrink-0"
                    style={{ color: "var(--terminal-text)", minWidth: 120 }}
                  >
                    {suggestion.command}
                  </span>
                  <span style={{ color: "var(--terminal-text-secondary)" }}>
                    {suggestion.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Separator between sections */}
          {suggestions.length > 0 && tickerResults.length > 0 && (
            <div
              style={{
                height: 1,
                backgroundColor: "var(--terminal-border)",
              }}
            />
          )}

          {/* Ticker search results section */}
          {tickerResults.length > 0 && (
            <div>
              <div
                className="px-3 py-1 font-mono select-none"
                style={{
                  fontSize: 10,
                  color: "var(--terminal-text-secondary)",
                  letterSpacing: "0.05em",
                }}
              >
                TICKERS
              </div>
              {tickerResults.map((ticker, index) => {
                const globalIndex = suggestions.length + index;
                return (
                  <button
                    key={ticker.symbol}
                    className="flex items-center w-full px-3 py-1.5 text-left font-mono text-xs"
                    style={{
                      backgroundColor:
                        globalIndex === selectedIndex
                          ? "var(--terminal-border)"
                          : "transparent",
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectTicker(ticker.symbol);
                    }}
                  >
                    <span
                      className="font-bold mr-3 shrink-0"
                      style={{
                        color: "var(--terminal-green)",
                        minWidth: 70,
                      }}
                    >
                      {ticker.symbol}
                    </span>
                    <span
                      className="flex-1 truncate mr-3"
                      style={{ color: "var(--terminal-text-secondary)" }}
                    >
                      {ticker.name}
                    </span>
                    <span
                      className="shrink-0"
                      style={{
                        color: "var(--terminal-border)",
                        fontSize: 10,
                      }}
                    >
                      {ticker.exchangeShortName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActiveTickerBadge() {
  const [activeTicker] = useAtom(activeTickerAtom);

  return (
    <span
      className="font-mono text-xs font-bold px-2 py-0.5 shrink-0 select-none"
      style={{
        backgroundColor: "var(--terminal-orange)",
        color: "var(--terminal-bg)",
        borderRadius: 0,
      }}
    >
      {activeTicker}
    </span>
  );
}
