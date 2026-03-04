import { NextRequest, NextResponse } from "next/server";
import { finnhub } from "@/lib/finnhub";

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json(
      { error: "Missing required query parameter: symbols" },
      { status: 400 },
    );
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "No valid symbols provided" },
      { status: 400 },
    );
  }

  try {
    const quotes = await finnhub.getQuotes(symbols);

    const data = quotes.map((q) => ({
      symbol: q.symbol,
      price: q.c,
      change: q.d,
      changePercent: q.dp,
      high: q.h,
      low: q.l,
      open: q.o,
      prevClose: q.pc,
      timestamp: q.t,
    }));

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=5",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quotes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
