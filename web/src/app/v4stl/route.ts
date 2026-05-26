import { serveNewestV4Stl, stlOptionsResponse } from "@/lib/stlResponse";

export const runtime = "nodejs";

// Tinkercad rejects URLs with a dot in the path (e.g. /v4.stl) as "Not a valid URL".
export async function GET() {
  return serveNewestV4Stl();
}

export async function OPTIONS() {
  return stlOptionsResponse();
}
