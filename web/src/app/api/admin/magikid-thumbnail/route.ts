import { NextRequest, NextResponse } from "next/server";
import {
  getCatalogBlobStore,
  MAGIKID_THUMB_BLOB_KEY,
  MAGIKID_THUMB_META_KEY,
  type CatalogImageMeta,
} from "@/lib/catalogBlobStorage";
import { MAGIKID_SHOES_THUMBNAIL_URL } from "@/lib/magikidShoesThumbnail";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
  verifyOrdersAdminPassword,
} from "@/lib/ordersAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  if (!isOrdersAdminConfigured()) return false;
  if (isOrdersAdminAuthenticated(request)) return true;
  const headerPassword = request.headers.get("x-admin-password")?.trim() || "";
  return verifyOrdersAdminPassword(headerPassword);
}

function resolveContentType(file: File): string {
  if (file.type.startsWith("image/")) return file.type;
  const lower = (file.name || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function POST(request: NextRequest) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json({ error: "Admin is not configured on the server." }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return unauthorizedOrdersResponse();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  const isImage =
    file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name || "");
  if (!isImage) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = resolveContentType(file);
  const meta: CatalogImageMeta = {
    contentType,
    bytes: bytes.length,
    updatedAt: new Date().toISOString(),
  };

  try {
    const store = getCatalogBlobStore();
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    await Promise.all([
      store.set(MAGIKID_THUMB_BLOB_KEY, arrayBuffer),
      store.set(MAGIKID_THUMB_META_KEY, JSON.stringify(meta)),
    ]);
  } catch (error) {
    console.error("magikid thumbnail blob write failed:", error);
    return NextResponse.json(
      { error: "Could not save thumbnail. Blob storage may be unavailable in this environment." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    path: MAGIKID_SHOES_THUMBNAIL_URL,
    bytes: bytes.length,
    contentType,
  });
}
