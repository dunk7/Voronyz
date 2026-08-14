import { NextRequest, NextResponse } from "next/server";
import { listGallerySubmissionsForAdmin } from "@/lib/gallerySubmission";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
    const submissions = await listGallerySubmissionsForAdmin(200);
    const pendingCount = submissions.filter((s) => s.status === "pending").length;
    return NextResponse.json({ submissions, pendingCount });
  } catch (err) {
    console.error("Failed to list gallery submissions:", err);
    return NextResponse.json(
      { error: "Failed to load gallery submissions." },
      { status: 500 }
    );
  }
}
