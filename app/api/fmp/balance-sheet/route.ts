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
    const statements = await fmp.getBalanceSheet(
      symbol.toUpperCase(),
      "quarter",
      5,
    );

    const data = statements.map((stmt) => {
      const currentRatio =
        stmt.totalCurrentLiabilities !== 0
          ? stmt.totalCurrentAssets / stmt.totalCurrentLiabilities
          : 0;

      return {
        quarter: `${stmt.fiscalYear || stmt.calendarYear || ""} ${stmt.period}`,
        totalAssets: stmt.totalAssets,
        totalLiabilities: stmt.totalLiabilities,
        totalEquity: stmt.totalStockholdersEquity,
        cash: stmt.cashAndCashEquivalents,
        totalDebt: stmt.totalDebt,
        netDebt: stmt.netDebt,
        currentRatio: Math.round(currentRatio * 100) / 100,
      };
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch balance sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
