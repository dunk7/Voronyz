import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthStubEnabled, setUserSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  if (!isAuthStubEnabled()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const { email, name } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  setUserSessionCookie(res, user.id);
  return res;
}


