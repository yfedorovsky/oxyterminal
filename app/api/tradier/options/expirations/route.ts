import { NextResponse } from "next/server";
import { getExpirations } from "@/lib/tradier";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const expirations = await getExpirations(symbol);
    return NextResponse.json({ expirations });
  } catch (err) {
    console.error("[tradier/expirations]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
