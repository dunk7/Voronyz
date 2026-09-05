import { NextResponse } from "next/server";
import { getActiveDiscountCodes } from "@/lib/discountDisabled";
import { listApprovedAffiliateDiscounts } from "@/lib/affiliateDiscounts";

export const dynamic = "force-dynamic";

/** Public list of discount codes still accepted on the site (admin-deleted codes omitted). */
export async function GET() {
  try {
    const codes = await getActiveDiscountCodes();
    const active = new Set(codes);
    const affiliateCodes = (await listApprovedAffiliateDiscounts())
      .map((row) => row.code)
      .filter((code) => active.has(code));
    return NextResponse.json({ codes, affiliateCodes });
  } catch (err) {
    console.error("Failed to load active discount codes:", err);
    return NextResponse.json(
      { error: "Could not load discount codes." },
      { status: 500 }
    );
  }
}
