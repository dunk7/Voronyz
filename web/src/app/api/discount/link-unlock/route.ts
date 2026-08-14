import { NextRequest, NextResponse } from "next/server";
import { isLinkOnlyDiscountCode } from "@/lib/discountPricing";
import {
  createDiscountLinkUnlockToken,
  discountLinkUnlockCookieOptions,
  DISCOUNT_LINK_UNLOCK_COOKIE,
} from "@/lib/discountLinkUnlock";
import { getInfluencerLinkBySlug } from "@/lib/influencerLinks";

export const dynamic = "force-dynamic";

/**
 * Sets the httpOnly short-link unlock cookie for link-only codes (e.g. aryan50).
 * Must be called with the vanity bio slug (/aryan), never the raw code string.
 * Knowing the slug is the same as having the short link — that is intentional.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug =
    body && typeof body === "object" && "slug" in body
      ? String((body as { slug?: unknown }).slug || "")
      : "";

  const influencer = getInfluencerLinkBySlug(slug);
  if (!influencer || !isLinkOnlyDiscountCode(influencer.code)) {
    // Do not reveal whether a slug/code exists.
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const token = createDiscountLinkUnlockToken(influencer.code);
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true, code: influencer.code });
  res.cookies.set(
    DISCOUNT_LINK_UNLOCK_COOKIE,
    token,
    discountLinkUnlockCookieOptions()
  );
  return res;
}
