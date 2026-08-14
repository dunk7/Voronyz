import { NextRequest, NextResponse } from "next/server";
import { loadGalleryImageBytes } from "@/lib/gallerySubmission";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
} from "@/lib/ordersAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!id || id.length > 80) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const image = await loadGalleryImageBytes(id);
    if (!image) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const isApproved = image.status === "approved";
    const isAdmin =
      isOrdersAdminConfigured() && isOrdersAdminAuthenticated(request);

    if (!isApproved && !isAdmin) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return new NextResponse(image.bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": image.mimeType || "image/jpeg",
        "Cache-Control": isApproved
          ? "public, max-age=86400, stale-while-revalidate=604800"
          : "private, no-store",
      },
    });
  } catch (err) {
    console.error("Gallery image serve failed:", err);
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
