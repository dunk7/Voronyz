import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  getCatalogBlobStore,
  MAGIKID_THUMB_BLOB_KEY,
  MAGIKID_THUMB_META_KEY,
  type CatalogImageMeta,
} from "@/lib/catalogBlobStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATIC_THUMB_PATH = path.join(
  process.cwd(),
  "public/products/magikid-shoes/magikid-shoes-thumbnail.jpg"
);

function imageResponse(bytes: Buffer, contentType: string) {
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

export async function GET() {
  try {
    const store = getCatalogBlobStore();
    const [blob, metaRaw] = await Promise.all([
      store.get(MAGIKID_THUMB_BLOB_KEY, { type: "arrayBuffer" }),
      store.get(MAGIKID_THUMB_META_KEY, { type: "text" }),
    ]);

    if (blob instanceof ArrayBuffer && blob.byteLength > 0) {
      let contentType = "image/jpeg";
      if (metaRaw && typeof metaRaw === "string") {
        try {
          const meta = JSON.parse(metaRaw) as CatalogImageMeta;
          if (meta.contentType) contentType = meta.contentType;
        } catch {
          /* use default */
        }
      }
      return imageResponse(Buffer.from(blob), contentType);
    }
  } catch (error) {
    console.error("magikid thumbnail blob read failed:", error);
  }

  try {
    const bytes = await readFile(STATIC_THUMB_PATH);
    const contentType = bytes[0] === 0x89 ? "image/png" : "image/jpeg";
    return imageResponse(bytes, contentType);
  } catch {
    return NextResponse.json({ error: "Thumbnail not found." }, { status: 404 });
  }
}
