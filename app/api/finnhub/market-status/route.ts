import { NextRequest, NextResponse } from "next/server";
import { finnhub } from "@/lib/finnhub";

export async function GET(_request: NextRequest) {
  try {
    const status = await finnhub.getMarketStatus();

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch market status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
