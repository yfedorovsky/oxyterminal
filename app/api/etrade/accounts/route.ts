import { NextResponse } from "next/server";
import { etrade } from "@/lib/etrade";
import { getAccessTokens } from "@/lib/etrade-token-store";

export async function GET() {
  try {
    const tokens = getAccessTokens();

    if (!tokens) {
      return NextResponse.json(
        { error: "Not authenticated. Please connect E*TRADE first." },
        { status: 401 }
      );
    }

    const accounts = await etrade.getAccounts(tokens.token, tokens.tokenSecret);

    return NextResponse.json(accounts, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch accounts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
