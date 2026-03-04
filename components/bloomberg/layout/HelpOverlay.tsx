"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { showHelpAtom } from "../atoms";
import { HELP_COMMANDS } from "@/lib/commands";

export default function HelpOverlay() {
  const [showHelp, setShowHelp] = useAtom(showHelpAtom);
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setShowHelp(false);
  }, [setShowHelp]);

  // Close on Escape
  useEffect(() => {
    if (!showHelp) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [showHelp, close]);

  // Close on click outside the modal
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) {
        close();
      }
    },
    [close]
  );

  if (!showHelp) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(10, 14, 20, 0.9)",
        zIndex: 200,
        borderRadius: 0,
      }}
      onClick={handleOverlayClick}
    >
      <div
        className="w-full font-mono"
        style={{
          maxWidth: 576,
          backgroundColor: "var(--terminal-card)",
          border: "1px solid var(--terminal-border)",
          padding: 24,
          borderRadius: 0,
        }}
      >
        {/* Title */}
        <h2
          className="panel-label mb-4"
          style={{
            color: "var(--terminal-orange)",
          }}
        >
          TERMINAL COMMANDS
        </h2>

        {/* Divider */}
        <div
          className="mb-3"
          style={{
            height: 1,
            backgroundColor: "var(--terminal-border)",
          }}
        />

        {/* Commands list */}
        <div
          className="overflow-y-auto terminal-scrollbar"
          style={{ maxHeight: 420 }}
        >
          {HELP_COMMANDS.map((cmd) => (
            <div
              key={cmd.command}
              className="flex items-baseline py-1.5 text-xs"
            >
              <span
                className="font-semibold shrink-0"
                style={{
                  color: "var(--terminal-orange)",
                  minWidth: 180,
                }}
              >
                {cmd.command}
              </span>
              <span style={{ color: "var(--terminal-text-secondary)" }}>
                {cmd.description}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="mt-4 pt-3 text-xs text-center"
          style={{
            borderTop: "1px solid var(--terminal-border)",
            color: "var(--terminal-text-secondary)",
          }}
        >
          Press{" "}
          <span style={{ color: "var(--terminal-orange)" }}>ESC</span>{" "}
          to close{" "}
          <span
            className="mx-2"
            style={{ color: "var(--terminal-border)" }}
          >
            |
          </span>{" "}
          Press{" "}
          <span style={{ color: "var(--terminal-orange)" }}>`</span>{" "}
          to open command bar
        </div>
      </div>
    </div>
  );
}
