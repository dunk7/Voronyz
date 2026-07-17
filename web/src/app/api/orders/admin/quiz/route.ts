import { NextRequest, NextResponse } from "next/server";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";
import { getQuizAdminStats } from "@/lib/quizStorage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Orders admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(request)) {
    return unauthorizedOrdersResponse();
  }

  try {
    const stats = await getQuizAdminStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Failed to load quiz poll stats:", err);
    return NextResponse.json(
      { error: "Could not load quiz results." },
      { status: 500 }
    );
  }
}
