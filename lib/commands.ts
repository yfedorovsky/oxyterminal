import type { Command, CommandType } from "@/components/bloomberg/types";

// ---------------------------------------------------------------------------
// Popular tickers for autocomplete suggestions
// ---------------------------------------------------------------------------
export const POPULAR_TICKERS: string[] = [
  "AAPL", "ABBV", "ABT", "ACN", "ADBE",
  "AMD", "AMGN", "AMZN", "AVGO", "AXP",
  "BA", "BAC", "BRK.B", "C", "CAT",
  "COP", "COST", "CRM", "CSCO", "CVX",
  "DHR", "DIS", "DOW", "GE", "GM",
  "GOOG", "GS", "HD", "HON", "IBM",
  "INTC", "JNJ", "JPM", "KO", "LLY",
  "LOW", "MA", "MCD", "MDT", "META",
  "MMM", "MRK", "MSFT", "MU", "NEE",
  "NFLX", "NKE", "NVDA", "ORCL", "PEP",
  "PFE", "PG", "PYPL", "QCOM", "QQQ",
  "SBUX", "SCHW", "SPY", "T", "TGT",
  "TMO", "TSLA", "TXN", "UNH", "UPS",
  "V", "VZ", "WFC", "WMT", "XOM",
];

// ---------------------------------------------------------------------------
// Command definitions – each maps a regex pattern to a CommandType
// ---------------------------------------------------------------------------
interface CommandDefinition {
  pattern: RegExp;
  type: CommandType;
  description: string;
}

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  // Standalone / global commands (no ticker prefix)
  { pattern: /^(?:\?|HELP)$/, type: "help", description: "Show help overlay with all commands" },
  { pattern: /^MOST$/, type: "movers", description: "Show most active / biggest movers" },
  { pattern: /^EARN$/, type: "earnings", description: "Show upcoming earnings calendar" },
  { pattern: /^BUZZ$/, type: "quote", description: "Show social buzz / trending tickers" },
  { pattern: /^(?:FEAR|SENTIMENT)$/, type: "sentiment", description: "Show market sentiment & fear/greed index" },
  { pattern: /^SECTOR\s+(\S+)$/, type: "sectors", description: "Show sector performance (e.g. SECTOR TECH)" },
  { pattern: /^STATS$/, type: "stats", description: "Show quick market statistics" },
  { pattern: /^BRIEF$/, type: "research", description: "Show AI research brief for active ticker" },
  { pattern: /^WL$/, type: "watchlist", description: "Open watchlist manager" },
  { pattern: /^SET$/, type: "layout", description: "Open terminal settings" },
  { pattern: /^CLEAR$/, type: "clear", description: "Clear the command history" },
  { pattern: /^(?:PORT|PORTFOLIO)$/, type: "portfolio", description: "Show portfolio & E*TRADE positions" },

  // Ticker + sub-command patterns
  { pattern: /^([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\s+(?:G|CHART)$/, type: "chart", description: "Open price chart for ticker" },
  { pattern: /^([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\s+DES$/, type: "description", description: "Show company description / profile" },
  { pattern: /^([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\s+FA$/, type: "financials", description: "Show financials & fundamentals" },
  { pattern: /^([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\s+OPT$/, type: "options", description: "Show options chain" },
  { pattern: /^([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\s+(?:N|NEWS)$/, type: "news", description: "Show news for ticker" },
  { pattern: /^([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\s+HDS$/, type: "quote", description: "Show major holders & institutional ownership" },
  { pattern: /^([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\s+AI$/, type: "research", description: "Show AI research analysis for ticker" },

  // Bare ticker (must be checked last – catch-all for valid ticker symbols)
  { pattern: /^([A-Z]{1,5}(?:\.[A-Z]{1,2})?)$/, type: "quote", description: "Load ticker quote" },
];

// ---------------------------------------------------------------------------
// Help commands – displayed in the help overlay
// ---------------------------------------------------------------------------
export const HELP_COMMANDS: Array<{ command: string; description: string }> = [
  { command: "<TICKER>", description: "Load quote for a ticker (e.g. AAPL)" },
  { command: "<TICKER> G / CHART", description: "Open price chart" },
  { command: "<TICKER> DES", description: "Company description & profile" },
  { command: "<TICKER> FA", description: "Financials & fundamentals" },
  { command: "<TICKER> OPT", description: "Options chain" },
  { command: "<TICKER> N / NEWS", description: "News feed for ticker" },
  { command: "<TICKER> HDS", description: "Major holders & ownership" },
  { command: "<TICKER> AI", description: "AI research analysis" },
  { command: "MOST", description: "Most active / biggest movers" },
  { command: "EARN", description: "Upcoming earnings calendar" },
  { command: "BUZZ", description: "Social buzz / trending tickers" },
  { command: "FEAR / SENTIMENT", description: "Market sentiment & fear/greed" },
  { command: "SECTOR <NAME>", description: "Sector performance (e.g. SECTOR TECH)" },
  { command: "STATS", description: "Quick market statistics" },
  { command: "BRIEF", description: "AI research brief for active ticker" },
  { command: "WL", description: "Watchlist manager" },
  { command: "SET", description: "Terminal settings" },
  { command: "CLEAR", description: "Clear command history" },
  { command: "PORT / PORTFOLIO", description: "Portfolio & E*TRADE positions" },
  { command: "? / HELP", description: "Show this help overlay" },
];

// ---------------------------------------------------------------------------
// parseCommand – turns raw user input into a structured Command
// ---------------------------------------------------------------------------
export function parseCommand(input: string): Command {
  const raw = input.trim();
  const normalized = raw.toUpperCase();

  if (!normalized) {
    return { raw, type: "unknown" };
  }

  for (const def of COMMAND_DEFINITIONS) {
    const match = normalized.match(def.pattern);
    if (match) {
      const command: Command = { raw, type: def.type };

      // If the regex captured a ticker group, attach it
      if (match[1]) {
        // For the SECTOR command the first capture is the sector name, not a ticker
        if (def.type === "sectors") {
          command.args = [match[1]];
        } else {
          command.ticker = match[1];
        }
      }

      return command;
    }
  }

  return { raw, type: "unknown" };
}

// ---------------------------------------------------------------------------
// getCommandSuggestions – fuzzy autocomplete for the command bar
// ---------------------------------------------------------------------------
export function getCommandSuggestions(
  input: string
): Array<{ command: string; description: string }> {
  const normalized = input.trim().toUpperCase();

  if (!normalized) {
    return [];
  }

  const results: Array<{ command: string; description: string; score: number }> = [];

  // --- Match against help commands ---
  for (const hc of HELP_COMMANDS) {
    const score = fuzzyScore(normalized, hc.command.toUpperCase());
    if (score > 0) {
      results.push({ command: hc.command, description: hc.description, score });
    }
  }

  // --- Match against popular tickers ---
  for (const ticker of POPULAR_TICKERS) {
    const score = fuzzyScore(normalized, ticker);
    if (score > 0) {
      // Avoid duplicating if a help-command already covers this ticker literally
      const alreadyPresent = results.some(
        (r) => r.command.toUpperCase() === ticker
      );
      if (!alreadyPresent) {
        results.push({
          command: ticker,
          description: `Load quote for ${ticker}`,
          score,
        });
      }
    }
  }

  // Sort by descending score, then alphabetically for ties
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.command.localeCompare(b.command);
  });

  // Return at most 10 suggestions
  return results.slice(0, 10).map(({ command, description }) => ({
    command,
    description,
  }));
}

// ---------------------------------------------------------------------------
// fuzzyScore – simple scoring: prefix match > substring match > character match
// ---------------------------------------------------------------------------
function fuzzyScore(query: string, target: string): number {
  // Exact match
  if (query === target) return 100;

  // Prefix match
  if (target.startsWith(query)) return 80 + (query.length / target.length) * 10;

  // Substring match
  if (target.includes(query)) return 50 + (query.length / target.length) * 10;

  // Character-by-character fuzzy match
  let qi = 0;
  let consecutiveBonus = 0;
  let lastMatchIndex = -2;

  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (query[qi] === target[ti]) {
      if (ti === lastMatchIndex + 1) {
        consecutiveBonus += 5;
      }
      lastMatchIndex = ti;
      qi++;
    }
  }

  // All query characters must be found in order
  if (qi < query.length) return 0;

  const baseScore = (qi / target.length) * 30;
  return baseScore + consecutiveBonus;
}
