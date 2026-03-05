// E*TRADE OAuth token storage for OxyTerminal.
// Single-user personal terminal — Map in memory is fine.
//
// On startup, tries to load cached tokens from mirbot's token file
// at ~/mirbot/scripts/.etrade_tokens.json (same OAuth tokens, shared auth).
// Format: { oauth_token, oauth_token_secret, env: "prod", created_at: ISO }

import fs from "fs";
import path from "path";
import os from "os";

interface StoredTokens {
  token: string;
  tokenSecret: string;
}

// mirbot token cache location
const MIRBOT_TOKEN_PATH = path.join(
  os.homedir(),
  "mirbot",
  "scripts",
  ".etrade_tokens.json"
);

const tokenStore = new Map<string, StoredTokens>();

// Attempt to seed access tokens from mirbot cache on first access
let _seeded = false;

function seedFromMirbot(): void {
  if (_seeded) return;
  _seeded = true;

  // Don't overwrite if we already have tokens (e.g. from OAuth dance)
  if (tokenStore.has("access")) return;

  try {
    if (!fs.existsSync(MIRBOT_TOKEN_PATH)) return;

    const raw = fs.readFileSync(MIRBOT_TOKEN_PATH, "utf-8");
    const data = JSON.parse(raw) as {
      oauth_token?: string;
      oauth_token_secret?: string;
      env?: string;
      created_at?: string;
    };

    // Only use prod tokens
    if (data.env !== "prod") return;
    if (!data.oauth_token || !data.oauth_token_secret) return;

    // Check freshness (2hr window, same as mirbot's etrade_renew.py)
    if (data.created_at) {
      const created = new Date(data.created_at);
      const ageMs = Date.now() - created.getTime();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (ageMs > twoHoursMs) {
        // Tokens are stale — don't use them
        return;
      }
    }

    tokenStore.set("access", {
      token: data.oauth_token,
      tokenSecret: data.oauth_token_secret,
    });

    // eslint-disable-next-line no-console
    console.log("[etrade] Loaded cached tokens from mirbot");
  } catch {
    // Silently ignore — user may not have mirbot set up
  }
}

export function storeRequestTokenSecret(
  requestToken: string,
  requestTokenSecret: string
): void {
  tokenStore.set(`request:${requestToken}`, {
    token: requestToken,
    tokenSecret: requestTokenSecret,
  });
}

export function getRequestTokenSecret(
  requestToken: string
): string | undefined {
  return tokenStore.get(`request:${requestToken}`)?.tokenSecret;
}

export function clearRequestToken(requestToken: string): void {
  tokenStore.delete(`request:${requestToken}`);
}

export function storeAccessTokens(
  token: string,
  tokenSecret: string
): void {
  tokenStore.set("access", { token, tokenSecret });
}

export function getAccessTokens(): StoredTokens | undefined {
  // Try to seed from mirbot on first access
  seedFromMirbot();
  return tokenStore.get("access");
}

export function hasAccessTokens(): boolean {
  // Try to seed from mirbot on first access
  seedFromMirbot();
  return tokenStore.has("access");
}

export function clearAccessTokens(): void {
  tokenStore.delete("access");
}
