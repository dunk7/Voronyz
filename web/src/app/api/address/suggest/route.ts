import { NextRequest, NextResponse } from "next/server";
import { AddressLookupError, suggestAddresses } from "@/lib/addressVerification";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const sessionToken =
    request.nextUrl.searchParams.get("session")?.trim().slice(0, 64) || undefined;

  if (query.length < 4 || query.length > 200) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await suggestAddresses(query, sessionToken);
    return NextResponse.json({ suggestions });
  } catch (error) {
    const status = error instanceof AddressLookupError ? error.status : 502;
    const message =
      error instanceof AddressLookupError
        ? error.message
        : "Address lookup is unavailable right now.";
    if (!(error instanceof AddressLookupError)) {
      console.error("Address suggest failed:", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
