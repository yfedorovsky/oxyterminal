"use client";

import { useAtom, useAtomValue } from "jotai";
import { panelsAtom, maximizedPanelAtom, flexPanelAtom } from "../atoms";
import type { PanelConfig, PanelType } from "../types";
import PanelCard from "./PanelCard";

// ---------------------------------------------------------------------------
// Panel component registry
// Lazy-load actual panel components here as they are built.
// For now, panels that don't exist yet render a placeholder.
// ---------------------------------------------------------------------------
import QuoteMonitor from "../panels/QuoteMonitor";
import MainChart from "../panels/MainChart";
import NewsFeed from "../panels/NewsFeed";
import SentimentGauges from "../panels/SentimentGauges";
import SectorLeaders from "../panels/SectorLeaders";
import AIResearch from "../panels/AIResearch";
import OptionsChain from "../panels/OptionsChain";
import EarningsCalendar from "../panels/EarningsCalendar";
import QuickStats from "../panels/QuickStats";
import Portfolio from "../panels/Portfolio";
import Description from "../panels/Description";
import Financials from "../panels/Financials";
import MostActive from "../panels/MostActive";
import Heatmap from "../panels/Heatmap";

const PANEL_COMPONENTS: Partial<Record<PanelType, React.ComponentType>> = {
  "quote-monitor": QuoteMonitor,
  "main-chart": MainChart,
  "news-feed": NewsFeed,
  "sentiment-gauges": SentimentGauges,
  "sector-leaders": SectorLeaders,
  "ai-research": AIResearch,
  "options-chain": OptionsChain,
  "earnings-calendar": EarningsCalendar,
  "quick-stats": QuickStats,
  "portfolio": Portfolio,
  "description": Description,
  "financials": Financials,
  "most-active": MostActive,
  "heatmap": Heatmap,
};

function PanelContent({ type }: { type: PanelType }) {
  const Component = PANEL_COMPONENTS[type];
  if (Component) return <Component />;

  return (
    <div
      className="flex items-center justify-center h-full font-mono text-xs"
      style={{ color: "var(--terminal-text-secondary)" }}
    >
      {type.toUpperCase().replace(/-/g, " ")}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid slot definitions
// Maps each panel type to its position in the grid.
// Top row (3 columns): quote-monitor | main-chart | news-feed
// Bottom row (6 columns): sentiment | sectors | ai-research | options | earnings | stats
// ---------------------------------------------------------------------------
interface GridSlot {
  type: PanelType;
  gridArea: string;
}

const GRID_SLOTS: GridSlot[] = [
  { type: "quote-monitor", gridArea: "qm" },
  { type: "main-chart", gridArea: "mc" },
  { type: "news-feed", gridArea: "nf" },
  { type: "sentiment-gauges", gridArea: "sg" },
  { type: "sector-leaders", gridArea: "sl" },
  { type: "ai-research", gridArea: "ar" },
  { type: "options-chain", gridArea: "oc" },
  { type: "earnings-calendar", gridArea: "ec" },
  { type: "quick-stats", gridArea: "qs" },
  { type: "portfolio", gridArea: "pf" },
];

// Map from flexPanelAtom value to panel title for display
const FLEX_PANEL_TITLES: Record<string, string> = {
  "options-chain": "Options",
  "description": "Description",
  "financials": "Financials",
  "most-active": "Most Active",
  "heatmap": "Heatmap",
};

export default function PanelWorkspace() {
  const [panels, setPanels] = useAtom(panelsAtom);
  const [maximizedPanel, setMaximizedPanel] = useAtom(maximizedPanelAtom);
  const flexPanel = useAtomValue(flexPanelAtom);

  const handleMaximize = (panel: PanelConfig) => {
    if (maximizedPanel === panel.id) {
      setMaximizedPanel(null);
      setPanels((prev) =>
        prev.map((p) =>
          p.id === panel.id ? { ...p, isMaximized: false } : p
        )
      );
    } else {
      setMaximizedPanel(panel.id);
      setPanels((prev) =>
        prev.map((p) => ({
          ...p,
          isMaximized: p.id === panel.id,
        }))
      );
    }
  };

  // If a panel is maximized, render only that panel
  if (maximizedPanel) {
    const panel = panels.find((p) => p.id === maximizedPanel);
    if (panel) {
      return (
        <div
          className="w-full"
          style={{
            height: "calc(100vh - 36px)",
            backgroundColor: "var(--terminal-bg)",
          }}
        >
          <PanelCard panel={panel} onMaximize={() => handleMaximize(panel)}>
            <PanelContent type={panel.type} />
          </PanelCard>
        </div>
      );
    }
  }

  // Compute effective grid slots: replace the "oc" slot type with the current flex panel
  const effectiveSlots: GridSlot[] = GRID_SLOTS.map((slot) =>
    slot.gridArea === "oc" ? { ...slot, type: flexPanel } : slot
  );

  // Build a map of type -> PanelConfig for quick lookup
  const panelsByType = new Map<PanelType, PanelConfig>();
  for (const p of panels) {
    panelsByType.set(p.type, p);
  }

  return (
    <div
      className="w-full"
      style={{
        height: "calc(100vh - 36px)",
        backgroundColor: "var(--terminal-bg)",
        display: "grid",
        gridTemplateAreas: `
          "qm mc mc nf pf"
          "qm mc mc nf pf"
          "qm mc mc nf pf"
          "sg sl ar oc pf"
          "sg sl ec qs pf"
        `,
        /*
         * Top row ~ 60%: 3 conceptual rows (qm/mc/nf)
         * Bottom row ~ 40%: 2 conceptual rows (sg/sl/ar/oc and sg/sl/ec/qs)
         * Portfolio panel spans the full right edge
         */
        gridTemplateRows: "1fr 1fr 1fr 1fr 1fr",
        gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr",
        gap: 2,
      }}
    >
      {effectiveSlots.map((slot) => {
        // For the flex slot, synthesize a PanelConfig if none exists in the panels array
        let panel = panelsByType.get(slot.type);
        if (!panel && slot.gridArea === "oc") {
          panel = {
            id: `panel-${slot.type}`,
            type: slot.type,
            title: FLEX_PANEL_TITLES[slot.type] ?? slot.type.toUpperCase().replace(/-/g, " "),
            linkColor: null,
            isMaximized: false,
          };
        }
        if (!panel) return null;

        return (
          <div
            key={`${slot.gridArea}-${slot.type}`}
            style={{
              gridArea: slot.gridArea,
              minWidth: 0,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <PanelCard
              panel={panel}
              onMaximize={() => handleMaximize(panel)}
            >
              <PanelContent type={panel.type} />
            </PanelCard>
          </div>
        );
      })}
    </div>
  );
}
