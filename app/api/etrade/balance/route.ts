import { NextRequest, NextResponse } from "next/server";
import { etrade } from "@/lib/etrade";
import { getAccessTokens } from "@/lib/etrade-token-store";

export async function GET(request: NextRequest) {
  try {
    const tokens = getAccessTokens();

    if (!tokens) {
      return NextResponse.json(
        { error: "Not authenticated. Please connect E*TRADE first." },
        { status: 401 }
      );
    }

    const accountId = request.nextUrl.searchParams.get("accountId");
    if (!accountId) {
      return NextResponse.json(
        { error: "Missing required query parameter: accountId" },
        { status: 400 }
      );
    }

    const balance = await etrade.getBalance(
      accountId,
      tokens.token,
      tokens.tokenSecret
    );

    if (!balance) {
      return NextResponse.json(
        { error: "Failed to retrieve balance" },
        { status: 500 }
      );
    }

    return NextResponse.json(balance, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=10",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
