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
    const statements = await fmp.getIncomeStatement(
      symbol.toUpperCase(),
      "quarter",
      5, // FMP free tier caps limit at 5
    );

    const data = statements.map((stmt, idx) => {
      // Calculate YoY revenue growth by comparing to same quarter prior year
      // (4 quarters back in the array if available)
      let revenueGrowth = 0;
      const priorIdx = idx + 4;
      if (priorIdx < statements.length && statements[priorIdx].revenue !== 0) {
        revenueGrowth =
          ((stmt.revenue - statements[priorIdx].revenue) /
            Math.abs(statements[priorIdx].revenue)) *
          100;
      }

      return {
        quarter: `${stmt.fiscalYear || stmt.calendarYear || ""} ${stmt.period}`,
        revenue: stmt.revenue,
        grossProfit: stmt.grossProfit,
        operatingIncome: stmt.operatingIncome,
        netIncome: stmt.netIncome,
        eps: stmt.eps,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
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
        : "Failed to fetch financial statements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
