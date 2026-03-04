import { NextRequest, NextResponse } from "next/server";
import { fmp } from "@/lib/fmp";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing required query parameter: symbol" },
      { status: 400 },
    );
  }

  try {
    const profiles = await fmp.getProfile(symbol.toUpperCase());
    const profile = profiles[0] || null;

    if (!profile) {
      return NextResponse.json(
        { error: `No profile found for symbol: ${symbol}` },
        { status: 404 },
      );
    }

    return NextResponse.json(profile, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch company profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
