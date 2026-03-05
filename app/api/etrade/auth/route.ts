import { NextRequest, NextResponse } from "next/server";
import { etrade } from "@/lib/etrade";
import {
  storeRequestTokenSecret,
  getRequestTokenSecret,
  clearRequestToken,
  storeAccessTokens,
  hasAccessTokens,
} from "@/lib/etrade-token-store";

// GET: Start OAuth flow - returns authorize URL and request token
export async function GET() {
  try {
    // Use out-of-band callback (user copies verifier code manually)
    const requestTokens = await etrade.getRequestToken("oob");

    // Store request token secret for later exchange
    storeRequestTokenSecret(requestTokens.token, requestTokens.tokenSecret);

    const authorizeUrl = etrade.getAuthorizeUrl(requestTokens.token);

    return NextResponse.json({
      authorizeUrl,
      requestToken: requestTokens.token,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start OAuth flow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Exchange verifier for access token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestToken, verifier } = body as {
      requestToken: string;
      verifier: string;
    };

    if (!requestToken || !verifier) {
      return NextResponse.json(
        { error: "Missing requestToken or verifier" },
        { status: 400 }
      );
    }

    const requestTokenSecret = getRequestTokenSecret(requestToken);
    if (!requestTokenSecret) {
      return NextResponse.json(
        { error: "Request token not found or expired. Please restart the OAuth flow." },
        { status: 400 }
      );
    }

    const accessTokens = await etrade.getAccessToken(
      requestToken,
      requestTokenSecret,
      verifier.trim()
    );

    // Store access tokens
    storeAccessTokens(accessTokens.token, accessTokens.tokenSecret);

    // Clean up request token
    clearRequestToken(requestToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to exchange verifier";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Check connection status (reusing DELETE since we only have GET/POST)
// Actually, let's add a status check via a query param on GET
// But to keep it simple, the frontend can just try fetching accounts

// PATCH: Disconnect (clear tokens)
export async function PATCH() {
  try {
    if (hasAccessTokens()) {
      // Clear stored tokens
      const { clearAccessTokens } = await import("@/lib/etrade-token-store");
      clearAccessTokens();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to disconnect";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
