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
    const profile = await finnhub.getCompanyProfile(symbol.toUpperCase());

    return NextResponse.json(profile, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
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
