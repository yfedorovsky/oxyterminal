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
    const statements = await fmp.getCashFlowStatement(
      symbol.toUpperCase(),
      "quarter",
      5,
    );

    const data = statements.map((stmt) => ({
      quarter: `${stmt.fiscalYear || stmt.calendarYear || ""} ${stmt.period}`,
      operatingCashFlow: stmt.operatingCashFlow,
      capitalExpenditure: stmt.capitalExpenditure,
      freeCashFlow: stmt.freeCashFlow,
      netIncome: stmt.netIncome,
      stockBasedCompensation: stmt.stockBasedCompensation,
      dividendsPaid: stmt.dividendsPaid,
      commonStockRepurchased: stmt.commonStockRepurchased,
    }));

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch cash flow statement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
