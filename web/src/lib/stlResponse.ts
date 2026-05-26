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
  const body = new Uint8Array(file);

  return new NextResponse(body, {
    headers: {
      ...STL_CORS_HEADERS,
      "Content-Type": "model/stl",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `attachment; filename="${newest.fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export function headNewestV4Stl(): NextResponse {
  const newest = getNewestV4StlPath();
  if (!newest) {
    return NextResponse.json(
      { error: "V4 STL not found" },
      { status: 404, headers: STL_CORS_HEADERS },
    );
  }

  const stat = fs.statSync(newest.filePath);
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...STL_CORS_HEADERS,
      "Content-Type": "model/stl",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${newest.fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
