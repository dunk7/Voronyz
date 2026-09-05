import type Stripe from "stripe";
import { AFFILIATE_ORDER_DISCOUNT_CENTS } from "@/lib/affiliateApproveLogic";

export const AFFILIATE_ORDER_COUPON_ID = "voronyz_affiliate_order_5off";

export async function ensureAffiliateOrderCoupon(stripe: Stripe): Promise<string | null> {
  try {
    await stripe.coupons.retrieve(AFFILIATE_ORDER_COUPON_ID);
    return AFFILIATE_ORDER_COUPON_ID;
  } catch {
    try {
      await stripe.coupons.create({
        id: AFFILIATE_ORDER_COUPON_ID,
        amount_off: AFFILIATE_ORDER_DISCOUNT_CENTS,
        currency: "usd",
        duration: "once",
        name: "$5 off whole order",
      });
      return AFFILIATE_ORDER_COUPON_ID;
    } catch (err) {
      console.error("Failed to create affiliate order coupon:", err);
      return null;
    }
  }
}
