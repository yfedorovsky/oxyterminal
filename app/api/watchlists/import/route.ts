import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

// Reads ~/mirbot/data/watchlists.json and flattens into Record<string, string[]>
export async function GET() {
  const filePath = join(homedir(), "mirbot", "data", "watchlists.json");

  try {
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);

    const excluded = new Set<string>(
      Array.isArray(data.excluded) ? data.excluded : []
    );

    // Map mirbot keys → OxyTerminal tab names
    const keyMap: Record<string, string> = {
      swing: "Swing",
      default: "Main",
      sectors: "Sectors",
      themes: "Themes",
      druckenmiller: "Druckenmiller",
    };

    const watchlists: Record<string, string[]> = {};

    // Flatten base.* lists
    if (data.base && typeof data.base === "object") {
      for (const [key, tickers] of Object.entries(data.base)) {
        if (!Array.isArray(tickers)) continue;
        const tabName = keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
        watchlists[tabName] = tickers.filter(
          (t: string) => typeof t === "string" && !excluded.has(t)
        );
      }
    }

    // Auto-discovered tickers → "Alerts"
    if (data.auto_discovered?.tickers && Array.isArray(data.auto_discovered.tickers)) {
      watchlists["Alerts"] = data.auto_discovered.tickers.filter(
        (t: string) => typeof t === "string" && !excluded.has(t)
      );
    }

    return NextResponse.json({
      watchlists,
      updatedAt: data.updated_at || null,
    });
  } catch (err) {
    console.error("[watchlists/import]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read watchlists" },
      { status: 500 }
    );
  }
}
