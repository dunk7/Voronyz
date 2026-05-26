import fs from "fs";
import { NextResponse } from "next/server";
import { getNewestV4StlPath } from "@/lib/v4StlDownload";

export const runtime = "nodejs";

export async function GET() {
  const newest = getNewestV4StlPath();
  if (!newest) {
    return NextResponse.json({ error: "V4 STL not found" }, { status: 404 });
  }

  const file = fs.readFileSync(newest.filePath);

  return new NextResponse(file, {
    headers: {
      "Content-Type": "model/stl",
      "Content-Disposition": `attachment; filename="${newest.fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
