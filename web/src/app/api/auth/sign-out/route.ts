import { NextResponse } from "next/server";
import { clearUserSessionCookie, isAuthStubEnabled } from "@/lib/session";

export async function POST() {
  if (!isAuthStubEnabled()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  clearUserSessionCookie(res);
  return res;
}


