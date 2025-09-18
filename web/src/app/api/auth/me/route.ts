import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, isAuthStubEnabled } from "@/lib/session";

export async function GET(req: NextRequest) {
  if (!isAuthStubEnabled()) return NextResponse.json({ user: null });
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return NextResponse.json({ user: user ? { id: user.id, email: user.email, name: user.name } : null });
}


