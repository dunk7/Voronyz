import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Tinkercad and other importers require a URL ending in .stl
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/v4stl.stl", request.url), 302);
}
