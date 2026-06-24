import { NextRequest, NextResponse } from "next/server";
import {
  getMessageEnabled,
  setMessageEnabled,
} from "@/lib/messageMaintenance";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";

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
    const enabled = await getMessageEnabled();
    return NextResponse.json({ enabled });
  } catch (err) {
    console.error("Failed to read message app setting:", err);
    return NextResponse.json(
      { error: "Could not load message app setting." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Orders admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(request)) {
    return unauthorizedOrdersResponse();
  }

  let body: { enabled?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "Body must include enabled: boolean." },
      { status: 400 }
    );
  }

  try {
    const enabled = await setMessageEnabled(body.enabled);
    return NextResponse.json({ enabled });
  } catch (err) {
    console.error("Failed to update message app setting:", err);
    return NextResponse.json(
      { error: "Could not update message app setting." },
      { status: 500 }
    );
  }
}
