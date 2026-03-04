import { NextRequest, NextResponse } from "next/server";
import { format, addDays } from "date-fns";
import { finnhub } from "@/lib/finnhub";

export async function GET(_request: NextRequest) {
  try {
    const from = format(new Date(), "yyyy-MM-dd");
    const to = format(addDays(new Date(), 14), "yyyy-MM-dd");

    const data = await finnhub.getEarningsCalendar(from, to);

    return NextResponse.json(data.earningsCalendar, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch earnings calendar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
