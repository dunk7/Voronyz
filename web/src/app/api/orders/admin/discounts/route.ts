import { NextRequest, NextResponse } from "next/server";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";
import {
  disableDiscountCode,
  getActiveDiscountCodes,
} from "@/lib/discountDisabled";
import {
  getDiscountAutoApplyUrl,
  getDiscountClickCounts,
  getSiteOrigin,
} from "@/lib/discountLinks";
import {
  buildInfluencerDiscountUrl,
  getInfluencerLinkForCode,
} from "@/lib/influencerLinks";
import { normalizeDiscountCode } from "@/lib/discountPricing";

export const dynamic = "force-dynamic";

function preferredShareUrl(code: string): string | null {
  const influencer = getInfluencerLinkForCode(code);
  if (influencer) return buildInfluencerDiscountUrl(influencer.slug);
  return getDiscountAutoApplyUrl(code);
}

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
    const activeCodes = await getActiveDiscountCodes();
    const clicksByCode = await getDiscountClickCounts(activeCodes);
    const codes = activeCodes.map((code) => {
      const influencer = getInfluencerLinkForCode(code);
      return {
        code,
        clicks: clicksByCode[code] ?? 0,
        autoApplyUrl: preferredShareUrl(code),
        status: "live" as const,
        influencerSlug: influencer?.slug ?? null,
        influencerLabel: influencer?.label ?? null,
      };
    });

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

export async function DELETE(request: NextRequest) {
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
    const body = (await request.json().catch(() => ({}))) as {
      code?: unknown;
    };
    const code =
      typeof body.code === "string" ? normalizeDiscountCode(body.code) : null;

    const result = await disableDiscountCode(code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      code: result.code,
      message: `Discount code "${result.code}" deleted and is no longer active on the site.`,
    });
  } catch (err) {
    console.error("Failed to delete discount code:", err);
    return NextResponse.json(
      { error: "Could not delete discount code." },
      { status: 500 }
    );
  }
}
