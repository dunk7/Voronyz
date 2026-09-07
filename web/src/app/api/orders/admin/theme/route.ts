import { NextRequest, NextResponse } from "next/server";
import { getSiteDarkMode, setSiteDarkMode } from "@/lib/siteTheme";
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
    const dark = await getSiteDarkMode();
    return NextResponse.json({ dark });
  } catch (err) {
    console.error("Failed to read dark mode setting:", err);
    return NextResponse.json(
      { error: "Could not load dark mode setting." },
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

  let body: { dark?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.dark !== "boolean") {
    return NextResponse.json(
      { error: "Body must include dark: boolean." },
      { status: 400 }
    );
  }

  try {
    const dark = await setSiteDarkMode(body.dark);
    return NextResponse.json({ dark });
  } catch (err) {
    console.error("Failed to update dark mode setting:", err);
    return NextResponse.json(
      { error: "Could not update dark mode setting." },
      { status: 500 }
    );
  }
}
