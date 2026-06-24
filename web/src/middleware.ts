import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMessageDisabled, MESSAGE_DOWN_MESSAGE } from "@/lib/messageMaintenance";

export function middleware(request: NextRequest) {
  if (!isMessageDisabled()) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/message")) {
    return NextResponse.json({ error: MESSAGE_DOWN_MESSAGE }, { status: 503 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/message", "/api/message/:path*"],
};
