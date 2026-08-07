import { NextRequest, NextResponse } from "next/server";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";
import { VALID_DISCOUNT_CODES } from "@/lib/discountPricing";
import {
  getDiscountAutoApplyUrl,
  getDiscountClickCounts,
  getSiteOrigin,
} from "@/lib/discountLinks";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Orders admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(request)) {
    return unauthorizedOrdersResponse();
  }

  try {
    const clicksByCode = await getDiscountClickCounts(VALID_DISCOUNT_CODES);
    const codes = VALID_DISCOUNT_CODES.map((code) => ({
      code,
      clicks: clicksByCode[code] ?? 0,
      autoApplyUrl: getDiscountAutoApplyUrl(code),
    }));

    return NextResponse.json({
      siteOrigin: getSiteOrigin(),
      codes,
    });
  } catch (err) {
    console.error("Failed to load discount link stats:", err);
    return NextResponse.json(
      { error: "Could not load discount link stats." },
      { status: 500 }
    );
  }
}
