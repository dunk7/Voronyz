import { NextRequest, NextResponse } from "next/server";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
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

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": user.avatarMimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
