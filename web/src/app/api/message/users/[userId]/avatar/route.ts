import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { messageDisabledResponse } from "@/lib/messageApiGuard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

function avatarEtag(buffer: Buffer, mimeType: string) {
  return `"${createHash("sha256").update(mimeType).update(buffer).digest("hex").slice(0, 32)}"`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const currentUserId = getMessageUserId(request);
  if (!currentUserId) return unauthorizedMessageResponse();

  const { userId } = await context.params;

  const user = await prisma.messengerUser.findFirst({
    where: {
      id: userId,
      OR: [
        { id: currentUserId },
        {
          conversationMembers: {
            some: {
              conversation: {
                members: { some: { userId: currentUserId } },
              },
            },
          },
        },
      ],
    },
    select: { avatarMimeType: true, avatarData: true },
  });

  if (!user?.avatarData?.length || !user.avatarMimeType) {
    return NextResponse.json({ error: "Avatar not found." }, { status: 404 });
  }

  const buffer = Buffer.isBuffer(user.avatarData)
    ? user.avatarData
    : Buffer.from(user.avatarData);
  const etag = avatarEtag(buffer, user.avatarMimeType);
  const ifNoneMatch = request.headers.get("if-none-match");

  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "private, no-cache, must-revalidate",
      },
    });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": user.avatarMimeType,
      "Content-Length": String(buffer.length),
      ETag: etag,
      "Cache-Control": "private, no-cache, must-revalidate",
    },
  });
}
