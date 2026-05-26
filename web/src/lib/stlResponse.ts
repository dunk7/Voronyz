import fs from "fs";
import { NextResponse } from "next/server";
import { getNewestV4StlPath } from "@/lib/v4StlDownload";

const STL_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export function stlOptionsResponse(): NextResponse {
  return new NextResponse(null, { headers: STL_CORS_HEADERS });
}

export function serveNewestV4Stl(): NextResponse {
  const newest = getNewestV4StlPath();
  if (!newest) {
    return NextResponse.json(
      { error: "V4 STL not found" },
      { status: 404, headers: STL_CORS_HEADERS },
    );
  }

  const file = fs.readFileSync(newest.filePath);

  return new NextResponse(file, {
    headers: {
      ...STL_CORS_HEADERS,
      "Content-Type": "application/sla",
      "Content-Length": String(file.byteLength),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
