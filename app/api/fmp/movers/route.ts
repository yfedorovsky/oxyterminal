import { NextRequest, NextResponse } from "next/server";
import { fmp } from "@/lib/fmp";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "gainers";

  if (type !== "gainers" && type !== "losers") {
    return NextResponse.json(
      { error: "Invalid type parameter. Must be 'gainers' or 'losers'" },
      { status: 400 },
    );
  }

  try {
    const movers =
      type === "gainers" ? await fmp.getGainers() : await fmp.getLosers();

    const data = movers.slice(0, 10).map((m) => ({
      ticker: m.symbol,
      name: m.name,
      last: m.price,
      change: m.change,
      changePct: m.changesPercentage,
      volume: 0,
    }));

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch market movers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
