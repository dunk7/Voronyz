import { NextRequest, NextResponse } from "next/server";
import {
  clearMessageSession,
  getMessageUserId,
  setMessageSession,
} from "@/lib/messageAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const userId = getMessageUserId(request);
  if (!userId) {
    return NextResponse.json({ authenticated: false });
  }

  const user = await prisma.messengerUser.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatarMimeType: true },
  });

  if (!user) {
    const res = NextResponse.json({ authenticated: false });
    clearMessageSession(res);
    return res;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarMimeType
        ? `/api/message/users/${user.id}/avatar`
        : null,
    },
  });
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  clearMessageSession(res);
  return res;
}

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  const user = await prisma.messengerUser.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const { verifyPassword } = await import("@/lib/messagePassword");
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    success: true,
    user: { id: user.id, username },
  });
  setMessageSession(res, user.id);
  return res;
}
