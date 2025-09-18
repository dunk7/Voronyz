import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, isAuthStubEnabled } from "@/lib/session";

export async function GET(req: NextRequest) {
  if (!isAuthStubEnabled()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ preferences: user.preferences ?? {}, footScanMetadata: user.footScanMetadata ?? {} });
}

export async function POST(req: NextRequest) {
  if (!isAuthStubEnabled()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { preferences, footScanMetadata } = await req.json();
  await prisma.user.update({ where: { id: userId }, data: { preferences, footScanMetadata } });
  return NextResponse.json({ ok: true });
}


