import { NextResponse } from "next/server";
import { hasAccessTokens } from "@/lib/etrade-token-store";

// GET: Check if E*TRADE is authenticated (has valid access tokens)
export async function GET() {
  const authenticated = hasAccessTokens();
  return NextResponse.json({ authenticated });
}
