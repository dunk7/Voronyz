import { NextRequest, NextResponse } from "next/server";
import { avatarUrlForUser } from "@/lib/messageAccess";
import { deleteAvatarFile, writeAvatarFile } from "@/lib/avatarBlobStorage";
import {
  inferMimeType,
  validateAvatarFile,
} from "@/lib/messageAttachment";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { hashPassword, verifyPassword } from "@/lib/messagePassword";
import { messageDisabledResponse } from "@/lib/messageApiGuard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const user = await prisma.messengerUser.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatarMimeType: true },
  });

  if (!user) return unauthorizedMessageResponse();

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: avatarUrlForUser(user),
    },
  });
}

export async function POST(request: NextRequest) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const remove = formData.get("remove") === "true";
  if (remove) {
    await deleteAvatarFile(userId);
    const user = await prisma.messengerUser.update({
      where: { id: userId },
      data: {
        avatarMimeType: null,
        avatarData: null,
        avatarStorageKey: null,
        avatarEtag: null,
      },
      select: { id: true, username: true, avatarMimeType: true },
    });
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: null,
      },
    });
  }

  const fileField = formData.get("avatar");
  if (!(fileField instanceof File)) {
    return NextResponse.json({ error: "Please choose an image." }, { status: 400 });
  }

  const validationError = validateAvatarFile(fileField);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const buffer = Buffer.from(await fileField.arrayBuffer());
  const mimeType = inferMimeType(fileField);
  const { storageKey, etag } = await writeAvatarFile(userId, buffer, mimeType);

  const user = await prisma.messengerUser.update({
    where: { id: userId },
    data: {
      avatarMimeType: mimeType,
      avatarData: null,
      avatarStorageKey: storageKey,
      avatarEtag: etag,
    },
    select: { id: true, username: true, avatarMimeType: true },
  });

  const avatarVersion = Date.now();

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: avatarUrlForUser(user, avatarVersion),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required." },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters." },
      { status: 400 }
    );
  }

  if (newPassword.length > 128) {
    return NextResponse.json(
      { error: "New password must be at most 128 characters." },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different from your current password." },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.messengerUser.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) return unauthorizedMessageResponse();

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.messengerUser.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to change password:", err);
    return NextResponse.json(
      { error: "Could not change password. Try again." },
      { status: 500 }
    );
  }
}
