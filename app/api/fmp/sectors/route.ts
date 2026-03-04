import { NextRequest, NextResponse } from "next/server";
import { fmp } from "@/lib/fmp";

export async function GET(_request: NextRequest) {
  try {
    const sectors = await fmp.getSectorPerformance();

    return NextResponse.json(sectors, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=150",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch sector performance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
