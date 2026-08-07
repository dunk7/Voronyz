import { NextRequest, NextResponse } from "next/server";
import { listAffiliateApplications } from "@/lib/affiliateApplication";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";

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
