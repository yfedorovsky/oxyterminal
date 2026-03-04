import { NextRequest, NextResponse } from "next/server";
import { finnhub } from "@/lib/finnhub";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing required query parameter: symbol" },
      { status: 400 },
    );
  }

  try {
    const sentiment = await finnhub.getSocialSentiment(symbol.toUpperCase());

    return NextResponse.json(sentiment, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=450",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch social sentiment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
