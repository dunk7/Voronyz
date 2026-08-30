import { NextResponse } from "next/server";
import { getActiveDiscountCodes } from "@/lib/discountDisabled";

export const dynamic = "force-dynamic";

/** Public list of discount codes still accepted on the site (admin-deleted codes omitted). */
export async function GET() {
  try {
    const codes = await getActiveDiscountCodes();
    return NextResponse.json({ codes });
  } catch (err) {
    console.error("Failed to load active discount codes:", err);
    return NextResponse.json(
      { error: "Could not load discount codes." },
      { status: 500 }
    );
  }
}
