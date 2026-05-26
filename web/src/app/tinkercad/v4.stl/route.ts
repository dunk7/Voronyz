import {
  headNewestV4Stl,
  serveNewestV4Stl,
  stlOptionsResponse,
} from "@/lib/stlResponse";

export const runtime = "nodejs";

export async function GET() {
  return serveNewestV4Stl();
}

export async function HEAD() {
  return headNewestV4Stl();
}

export async function OPTIONS() {
  return stlOptionsResponse();
}
