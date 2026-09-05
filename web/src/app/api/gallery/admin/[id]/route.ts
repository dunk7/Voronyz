import { NextRequest, NextResponse } from "next/server";
import {
  GALLERY_STATUSES,
  type GalleryStatus,
  deleteGallerySubmission,
  updateGallerySubmissionStatus,
} from "@/lib/gallerySubmission";
import { ensureGallerySubmissionTable } from "@/lib/ensureGallerySubmissionTable";
import {
  hideCatalogGalleryPhoto,
  isCatalogGalleryPhotoId,
} from "@/lib/galleryHidden";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(request)) {
    return unauthorizedOrdersResponse();
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    await ensureGallerySubmissionTable();
  } catch (schemaErr) {
    console.error("Gallery schema ensure failed:", schemaErr);
    return NextResponse.json(
      { error: "Gallery database is not ready yet." },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing submission id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status =
    body &&
    typeof body === "object" &&
    "status" in body &&
    typeof (body as { status: unknown }).status === "string"
      ? ((body as { status: string }).status as GalleryStatus)
      : null;

  if (!status || !GALLERY_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Status must be pending, approved, or rejected." },
      { status: 400 }
    );
  }

  if (isCatalogGalleryPhotoId(id)) {
    return NextResponse.json(
      { error: "Site gallery photos cannot be approved or rejected. Delete them instead." },
      { status: 400 }
    );
  }

  const updated = await updateGallerySubmissionStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  return NextResponse.json({ submission: updated });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(_request)) {
    return unauthorizedOrdersResponse();
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing photo id." }, { status: 400 });
  }

  if (isCatalogGalleryPhotoId(id)) {
    const result = await hideCatalogGalleryPhoto(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, source: "catalog", id: result.id });
  }

  try {
    await ensureGallerySubmissionTable();
  } catch (schemaErr) {
    console.error("Gallery schema ensure failed:", schemaErr);
    return NextResponse.json(
      { error: "Gallery database is not ready yet." },
      { status: 503 }
    );
  }

  const deleted = await deleteGallerySubmission(id);
  if (!deleted) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, source: "submission", id });
}
