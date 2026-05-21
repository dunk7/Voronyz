import { NextRequest, NextResponse } from "next/server";
import {
  clearOrdersAdminSession,
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  setOrdersAdminSession,
  verifyOrdersAdminPassword,
} from "@/lib/ordersAdmin";

export async function GET(request: NextRequest) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { authenticated: false, configured: false },
      { status: 503 }
    );
  }

  return NextResponse.json({
    authenticated: isOrdersAdminAuthenticated(request),
    configured: true,
  });
}

export async function POST(request: NextRequest) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Orders admin is not configured on the server." },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!verifyOrdersAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  setOrdersAdminSession(res);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  clearOrdersAdminSession(res);
  return res;
}
