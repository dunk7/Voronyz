import { NextResponse } from "next/server";
import { isMessageDisabled, MESSAGE_DOWN_MESSAGE } from "@/lib/messageMaintenance";

export async function messageDisabledResponse(): Promise<NextResponse | null> {
  if (await isMessageDisabled()) {
    return NextResponse.json({ error: MESSAGE_DOWN_MESSAGE }, { status: 503 });
  }
  return null;
}
