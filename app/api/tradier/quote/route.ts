import { NextResponse } from "next/server";
import { getQuote } from "@/lib/tradier";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const quote = await getQuote(symbol);
    return NextResponse.json(quote);
  } catch (err) {
    console.error("[tradier/quote]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
