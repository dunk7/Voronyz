import { NextRequest, NextResponse } from "next/server";
import {
  AddressLookupError,
  UnrecognizedAddressError,
  verifyAndSignManualAddress,
} from "@/lib/addressVerification";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { address, token, unverified } = await verifyAndSignManualAddress(body);
    return NextResponse.json({
      address: { ...address, name: "" },
      token,
      ...(unverified ? { unverified: true } : {}),
    });
  } catch (error) {
    const status = error instanceof AddressLookupError ? error.status : 502;
    const message =
      error instanceof AddressLookupError
        ? error.message
        : "Address verification is unavailable right now.";
    if (!(error instanceof AddressLookupError)) {
      console.error("Manual address verification failed:", error);
    }
    return NextResponse.json(
      {
        error: message,
        ...(error instanceof UnrecognizedAddressError
          ? { code: error.code }
          : {}),
      },
      { status }
    );
  }
}
