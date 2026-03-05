import { NextResponse } from "next/server";
import { generateResearchBrief } from "@/lib/perplexity";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const brief = await generateResearchBrief(symbol);

    return NextResponse.json(brief, {
      headers: {
        "Cache-Control": "s-maxage=900, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[research/brief]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
