import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "session_user_id";

export function getUserIdFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE)?.value;
}

export function setUserSessionCookie(res: NextResponse, userId: string) {
  res.cookies.set(SESSION_COOKIE, userId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearUserSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export function isAuthStubEnabled() {
  // Enable auth stub by default for testing/demo purposes
  return process.env.AUTH_STUB_ENABLED === "false" ? false : true;
}


