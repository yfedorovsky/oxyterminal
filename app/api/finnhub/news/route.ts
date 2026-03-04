import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { finnhub } from "@/lib/finnhub";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  try {
    let news;

    if (symbol) {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 7), "yyyy-MM-dd");
      news = await finnhub.getCompanyNews(symbol.toUpperCase(), from, to);
    } else {
      news = await finnhub.getMarketNews("general");
    }

    const data = news.map((item) => ({
      id: item.id,
      headline: item.headline,
      source: item.source,
      datetime: item.datetime,
      summary: item.summary,
      url: item.url,
      image: item.image,
      related: item.related,
    }));

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch news";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
