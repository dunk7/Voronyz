import { NextRequest, NextResponse } from "next/server";
import { setMessageSession } from "@/lib/messageAuth";
import { hashPassword } from "@/lib/messagePassword";
import {
  isValidUsername,
  normalizeUsername,
  usernameValidationError,
} from "@/lib/messageUsername";
import { prisma } from "@/lib/prisma";
import { messengerDatabaseErrorMessage } from "@/lib/messageDatabaseError";

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = normalizeUsername(body.username ?? "");
  const password = typeof body.password === "string" ? body.password : "";

  const usernameError = usernameValidationError(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  if (password.length > 128) {
    return NextResponse.json(
      { error: "Password must be at most 128 characters." },
      { status: 400 }
    );
  }

  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "Invalid username." }, { status: 400 });
  }

  try {
    const existing = await prisma.messengerUser.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.messengerUser.create({
      data: { username, passwordHash },
      select: { id: true, username: true },
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
    setMessageSession(res, user.id);
    return res;
  } catch (err) {
    console.error("Message auth registration failed:", err);
    return NextResponse.json(
      { error: messengerDatabaseErrorMessage(err) },
      { status: 503 }
    );
  }
}
