"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  activeTickerAtom,
  commandBarOpenAtom,
  commandHistoryAtom,
  activeCommandAtom,
  showHelpAtom,
} from "../atoms";
import { parseCommand, getCommandSuggestions } from "@/lib/commands";

export default function CommandBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [commandBarOpen, setCommandBarOpen] = useAtom(commandBarOpenAtom);
  const [activeCommand, setActiveCommand] = useAtom(activeCommandAtom);
  const [commandHistory, setCommandHistory] = useAtom(commandHistoryAtom);
  const setActiveTicker = useSetAtom(activeTickerAtom);
  const setShowHelp = useSetAtom(showHelpAtom);

  const [inputValue, setInputValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<
    Array<{ command: string; description: string }>
  >([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update suggestions as user types
  useEffect(() => {
    if (inputValue.trim()) {
      const results = getCommandSuggestions(inputValue);
      setSuggestions(results);
      setSelectedSuggestion(0);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
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

      // Clear input
      setInputValue("");
      setHistoryIndex(-1);
      setShowSuggestions(false);
    },
    [setCommandHistory, setActiveCommand, setActiveTicker, setShowHelp]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      inputRef.current?.blur();
      setCommandBarOpen(false);
      setShowSuggestions(false);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        const selected = suggestions[selectedSuggestion];
        if (selected) {
          executeCommand(selected.command);
          return;
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
      if (showSuggestions && suggestions.length > 0) {
        setSelectedSuggestion((prev) =>
          prev <= 0 ? suggestions.length - 1 : prev - 1
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
      if (showSuggestions && suggestions.length > 0) {
        setSelectedSuggestion((prev) =>
          prev >= suggestions.length - 1 ? 0 : prev + 1
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

    // Tab to autocomplete selected suggestion
    if (e.key === "Tab" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      const selected = suggestions[selectedSuggestion];
      if (selected) {
        setInputValue(selected.command);
        setShowSuggestions(false);
      }
    }
  };

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
              setShowSuggestions(false);
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
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 overflow-y-auto terminal-scrollbar"
          style={{
            top: 36,
            maxHeight: 280,
            backgroundColor: "var(--terminal-card)",
            border: "1px solid var(--terminal-border)",
            borderTop: "none",
            zIndex: 101,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.command}
              className="flex items-center w-full px-3 py-1.5 text-left font-mono text-xs"
              style={{
                backgroundColor:
                  index === selectedSuggestion
                    ? "var(--terminal-border)"
                    : "transparent",
              }}
              onMouseEnter={() => setSelectedSuggestion(index)}
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
