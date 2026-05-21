import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ORDERS_ADMIN_COOKIE = "orders_admin_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getAdminSecret(): string | undefined {
  return process.env.ORDERS_ADMIN_PASSWORD?.trim() || undefined;
}

function getSessionToken(secret: string): string {
  return createHmac("sha256", secret).update("voronyz-orders-admin-v1").digest("hex");
}

export function isOrdersAdminConfigured(): boolean {
  return Boolean(getAdminSecret());
}

export function verifyOrdersAdminPassword(password: string): boolean {
  const secret = getAdminSecret();
  if (!secret || !password) return false;

  const expected = Buffer.from(secret, "utf8");
  const received = Buffer.from(password, "utf8");
  if (expected.length !== received.length) return false;

  return timingSafeEqual(expected, received);
}

export function isOrdersAdminAuthenticated(req: NextRequest): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;

  const cookie = req.cookies.get(ORDERS_ADMIN_COOKIE)?.value;
  if (!cookie) return false;

  const expected = getSessionToken(secret);
  try {
    const a = Buffer.from(cookie, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function setOrdersAdminSession(res: NextResponse): void {
  const secret = getAdminSecret();
  if (!secret) return;

  res.cookies.set(ORDERS_ADMIN_COOKIE, getSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearOrdersAdminSession(res: NextResponse): void {
  res.cookies.set(ORDERS_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function unauthorizedOrdersResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
