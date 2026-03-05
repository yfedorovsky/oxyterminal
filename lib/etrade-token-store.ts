// E*TRADE OAuth token storage for OxyTerminal.
// Single-user personal terminal.
//
// Uses globalThis to survive Next.js HMR (dev mode module re-evaluation).
// Also persists access tokens to disk at ~/.oxyterminal/.etrade_tokens.json
// so they survive full server restarts.
//
// On startup, tries to load cached tokens from:
// 1. OxyTerminal's own cache at ~/.oxyterminal/.etrade_tokens.json
// 2. mirbot's token file at ~/mirbot/scripts/.etrade_tokens.json
//
// mirbot format: { oauth_token, oauth_token_secret, env: "prod", created_at: ISO }

import fs from "fs";
import path from "path";
import os from "os";

interface StoredTokens {
  token: string;
  tokenSecret: string;
}

// ─── Paths ──────────────────────────────────────────────────────────────

const OXY_DIR = path.join(os.homedir(), ".oxyterminal");
const OXY_TOKEN_PATH = path.join(OXY_DIR, ".etrade_tokens.json");
const MIRBOT_TOKEN_PATH = path.join(
  os.homedir(),
  "mirbot",
  "scripts",
  ".etrade_tokens.json"
);

// ─── HMR-Safe Store via globalThis ──────────────────────────────────────

const GLOBAL_KEY = "__oxyterminal_etrade_tokens__" as const;

interface TokenStoreGlobal {
  [GLOBAL_KEY]?: Map<string, StoredTokens>;
}

function getStore(): Map<string, StoredTokens> {
  const g = globalThis as unknown as TokenStoreGlobal;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map<string, StoredTokens>();
  }
  return g[GLOBAL_KEY];
}

// ─── Disk Persistence ───────────────────────────────────────────────────

function persistToDisk(tokens: StoredTokens): void {
  try {
    if (!fs.existsSync(OXY_DIR)) {
      fs.mkdirSync(OXY_DIR, { recursive: true });
    }
    const data = {
      oauth_token: tokens.token,
      oauth_token_secret: tokens.tokenSecret,
      env: "prod",
      created_at: new Date().toISOString(),
    };
    fs.writeFileSync(OXY_TOKEN_PATH, JSON.stringify(data, null, 2), "utf-8");
    // eslint-disable-next-line no-console
    console.log("[etrade] Persisted access tokens to disk");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[etrade] Failed to persist tokens to disk:", err);
  }
}

function loadFromDisk(): StoredTokens | null {
  // Try OxyTerminal's own cache first
  const oxyTokens = loadTokenFile(OXY_TOKEN_PATH, "oxyterminal");
  if (oxyTokens) return oxyTokens;

  // Fall back to mirbot's cache
  const mirbotTokens = loadTokenFile(MIRBOT_TOKEN_PATH, "mirbot");
  if (mirbotTokens) return mirbotTokens;

  return null;
}

function loadTokenFile(
  filePath: string,
  source: string
): StoredTokens | null {
  try {
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as {
      oauth_token?: string;
      oauth_token_secret?: string;
      env?: string;
      created_at?: string;
    };

    // Only use prod tokens
    if (data.env && data.env !== "prod") return null;
    if (!data.oauth_token || !data.oauth_token_secret) return null;

    // Check freshness (2hr window, same as mirbot's etrade_renew.py)
    if (data.created_at) {
      const created = new Date(data.created_at);
      const ageMs = Date.now() - created.getTime();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (ageMs > twoHoursMs) {
        // eslint-disable-next-line no-console
        console.log(`[etrade] Tokens from ${source} are stale (${Math.round(ageMs / 60000)}min old)`);
        return null;
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[etrade] Loaded cached tokens from ${source}`);
    return {
      token: data.oauth_token,
      tokenSecret: data.oauth_token_secret,
    };
  } catch {
    return null;
  }
}

// ─── Seed from disk on first access ─────────────────────────────────────

const SEEDED_KEY = "__oxyterminal_etrade_seeded__" as const;
interface SeededGlobal {
  [SEEDED_KEY]?: boolean;
}

function seedFromDisk(): void {
  const g = globalThis as unknown as SeededGlobal;
  if (g[SEEDED_KEY]) return;
  g[SEEDED_KEY] = true;

  const store = getStore();

  // Don't overwrite if we already have tokens (e.g. from OAuth dance)
  if (store.has("access")) {
    // eslint-disable-next-line no-console
    console.log("[etrade] Already have access tokens in memory, skipping disk seed");
    return;
  }

  const tokens = loadFromDisk();
  if (tokens) {
    store.set("access", tokens);
  } else {
    // eslint-disable-next-line no-console
    console.log("[etrade] No cached tokens found on disk");
  }
}

// ─── Public API ─────────────────────────────────────────────────────────

export function storeRequestTokenSecret(
  requestToken: string,
  requestTokenSecret: string
): void {
  const store = getStore();
  store.set(`request:${requestToken}`, {
    token: requestToken,
    tokenSecret: requestTokenSecret,
  });
  // eslint-disable-next-line no-console
  console.log(`[etrade] Stored request token: ${requestToken.slice(0, 12)}...`);
}

export function getRequestTokenSecret(
  requestToken: string
): string | undefined {
  const store = getStore();
  const result = store.get(`request:${requestToken}`)?.tokenSecret;
  // eslint-disable-next-line no-console
  console.log(`[etrade] Get request token secret for ${requestToken.slice(0, 12)}...: ${result ? "found" : "NOT FOUND"}`);
  // eslint-disable-next-line no-console
  console.log(`[etrade] Store has ${store.size} entries: [${Array.from(store.keys()).join(", ")}]`);
  return result;
}

export function clearRequestToken(requestToken: string): void {
  getStore().delete(`request:${requestToken}`);
}

export function storeAccessTokens(
  token: string,
  tokenSecret: string
): void {
  const tokens = { token, tokenSecret };
  getStore().set("access", tokens);
  // Also persist to disk for server restarts
  persistToDisk(tokens);
  // eslint-disable-next-line no-console
  console.log("[etrade] Stored access tokens in memory + disk");
}

export function getAccessTokens(): StoredTokens | undefined {
  // Try to seed from disk on first access
  seedFromDisk();
  const store = getStore();
  const tokens = store.get("access");
  // eslint-disable-next-line no-console
  console.log(`[etrade] getAccessTokens: ${tokens ? "found" : "NOT FOUND"} (store size: ${store.size})`);
  return tokens;
}

export function hasAccessTokens(): boolean {
  // Try to seed from disk on first access
  seedFromDisk();
  return getStore().has("access");
}

export function clearAccessTokens(): void {
  getStore().delete("access");
  // Also clear from disk
  try {
    if (fs.existsSync(OXY_TOKEN_PATH)) {
      fs.unlinkSync(OXY_TOKEN_PATH);
    }
  } catch {
    // ignore
  }
  // eslint-disable-next-line no-console
  console.log("[etrade] Cleared access tokens from memory + disk");
}
