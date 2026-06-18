import { NextRequest, NextResponse } from "next/server";
import { avatarUrlForUser } from "@/lib/messageAccess";
import {
  inferMimeType,
  validateAvatarFile,
} from "@/lib/messageAttachment";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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
    const user = await prisma.messengerUser.update({
      where: { id: userId },
      data: { avatarMimeType: null, avatarData: null },
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

  const user = await prisma.messengerUser.update({
    where: { id: userId },
    data: {
      avatarMimeType: mimeType,
      avatarData: buffer,
    },
    select: { id: true, username: true, avatarMimeType: true },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: avatarUrlForUser(user),
    },
  });
}
