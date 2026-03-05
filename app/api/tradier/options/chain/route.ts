import { NextResponse } from "next/server";
import { getOptionsChain } from "@/lib/tradier";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const expiration = searchParams.get("expiration");

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  if (!expiration) {
    return NextResponse.json({ error: "expiration required" }, { status: 400 });
  }

  try {
    const options = await getOptionsChain(symbol, expiration);
    return NextResponse.json({ options });
  } catch (err) {
    console.error("[tradier/chain]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
