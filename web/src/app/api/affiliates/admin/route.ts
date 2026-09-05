import { NextRequest, NextResponse } from "next/server";
import {
  approveAffiliateApplication,
  listAffiliateApplications,
  rejectAffiliateApplication,
} from "@/lib/affiliateApplication";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";

export const dynamic = "force-dynamic";

function adminGuard(request: NextRequest) {
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

  return null;
}

export async function GET(request: NextRequest) {
  const blocked = adminGuard(request);
  if (blocked) return blocked;

  try {
    const applications = await listAffiliateApplications(200);
    return NextResponse.json({ applications });
  } catch (err) {
    console.error("Failed to list affiliate applications:", err);
    return NextResponse.json(
      { error: "Failed to load affiliate applications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const blocked = adminGuard(request);
  if (blocked) return blocked;

  let body: { id?: unknown; action?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; action?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

  if (!id) {
    return NextResponse.json({ error: "Application id is required." }, { status: 400 });
  }

  try {
    if (action === "approve") {
      const result = await approveAffiliateApplication(id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({
        ok: true,
        action: "approve",
        application: result.application,
      });
    }

    if (action === "reject") {
      const result = await rejectAffiliateApplication(id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({
        ok: true,
        action: "reject",
        id: result.id,
      });
    }

    return NextResponse.json(
      { error: "Action must be approve or reject." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Failed to update affiliate application:", err);
    return NextResponse.json(
      { error: "Failed to update affiliate application." },
      { status: 500 }
    );
  }
}
