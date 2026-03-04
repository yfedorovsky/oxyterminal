"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import type { PanelConfig, LinkColor } from "../types";

interface PanelCardProps {
  panel: PanelConfig;
  children: ReactNode;
  onMaximize?: () => void;
}

const LINK_COLORS: Record<NonNullable<LinkColor>, string> = {
  green: "var(--terminal-green)",
  blue: "var(--terminal-blue)",
  yellow: "var(--terminal-orange)",
  red: "var(--terminal-red)",
};

export default function PanelCard({
  panel,
  children,
  onMaximize,
}: PanelCardProps) {
  const linkColorValue = panel.linkColor
    ? LINK_COLORS[panel.linkColor]
    : undefined;

  const handleHeaderDoubleClick = useCallback(() => {
    onMaximize?.();
  }, [onMaximize]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: "var(--terminal-surface)",
        border: "1px solid var(--terminal-border)",
        borderLeft: linkColorValue
          ? `2px solid ${linkColorValue}`
          : "1px solid var(--terminal-border)",
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 shrink-0 select-none"
        style={{
          height: 28,
          backgroundColor: "var(--terminal-card)",
          borderRadius: 0,
        }}
        onDoubleClick={handleHeaderDoubleClick}
      >
        {/* Left: link color indicator */}
        <div className="flex items-center shrink-0" style={{ width: 16 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 0,
              backgroundColor: linkColorValue || "var(--terminal-border)",
            }}
          />
        </div>

        {/* Center: title */}
        <span
          className="panel-label flex-1 text-center"
          style={{
            color: "var(--terminal-text-secondary)",
          }}
        >
          {panel.title}
        </span>

        {/* Right: maximize button */}
        <button
          className="flex items-center justify-center shrink-0"
          style={{
            width: 14,
            height: 14,
            border: "1px solid var(--terminal-text-secondary)",
            backgroundColor: "transparent",
            borderRadius: 0,
            cursor: "pointer",
          }}
          onClick={onMaximize}
          title={panel.isMaximized ? "Restore" : "Maximize"}
        >
          {panel.isMaximized && (
            <div
              style={{
                width: 6,
                height: 6,
                backgroundColor: "var(--terminal-text-secondary)",
                borderRadius: 0,
              }}
            />
          )}
        </button>
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto terminal-scrollbar p-2"
        style={{ borderRadius: 0 }}
      >
        {children}
      </div>
    </div>
  );
}
