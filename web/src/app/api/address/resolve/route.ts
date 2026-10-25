import { NextRequest, NextResponse } from "next/server";
import { AddressLookupError, resolveSuggestion } from "@/lib/addressVerification";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { id?: unknown; session?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const session =
    typeof body.session === "string" ? body.session.trim().slice(0, 64) : undefined;
  if (!id || id.length > 300) {
    return NextResponse.json({ error: "Address id required" }, { status: 400 });
  }

  try {
    const { address, token } = await resolveSuggestion(id, session);
    return NextResponse.json({ address: { ...address, name: "", line2: null }, token });
  } catch (error) {
    const status = error instanceof AddressLookupError ? error.status : 502;
    const message =
      error instanceof AddressLookupError
        ? error.message
        : "Address lookup is unavailable right now.";
    if (!(error instanceof AddressLookupError)) {
      console.error("Address resolve failed:", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
