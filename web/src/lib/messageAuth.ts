import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const MESSAGE_SESSION_COOKIE = "message_session";

function getSessionSecret(): string {
  const secret =
    process.env.MESSAGE_SESSION_SECRET?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "voronyz-message-dev-secret";
  return secret;
}

function getSessionToken(userId: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(`voronyz-message-v1:${userId}`)
    .digest("hex");
}

export function createMessageSessionValue(userId: string): string {
  return `${userId}.${getSessionToken(userId)}`;
}

export function parseMessageSession(
  cookieValue: string | undefined
): string | null {
  if (!cookieValue) return null;

  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex <= 0) return null;

  const userId = cookieValue.slice(0, dotIndex);
  const token = cookieValue.slice(dotIndex + 1);
  if (!userId || !token) return null;

  const expected = getSessionToken(userId);
  try {
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}

export function getMessageUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get(MESSAGE_SESSION_COOKIE)?.value;
  return parseMessageSession(cookie);
}

export function setMessageSession(
  res: NextResponse,
  userId: string
): void {
  res.cookies.set(MESSAGE_SESSION_COOKIE, createMessageSessionValue(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export function clearMessageSession(res: NextResponse): void {
  res.cookies.set(MESSAGE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function unauthorizedMessageResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
