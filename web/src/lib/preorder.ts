import { getApparelItem } from "@/lib/apparel";

/**
 * Coming-soon catalog items (currently apparel) can be pre-ordered:
 * customer pays now and joins the waitlist; we ship when stock arrives.
 */
export function isComingSoonPreOrderProduct(slug: string | null | undefined): boolean {
  const item = getApparelItem(slug);
  return Boolean(item?.comingSoon);
}

/** Resolve whether a cart/checkout line should be treated as a pre-order. */
export function resolveIsPreOrder(input: {
  isPreOrder?: boolean | null;
  productSlug?: string | null;
}): boolean {
  if (input.isPreOrder === true) return true;
  if (input.isPreOrder === false) return false;
  return isComingSoonPreOrderProduct(input.productSlug);
}

export function cartHasPreOrder(
  items: Array<{ isPreOrder?: boolean | null; productSlug?: string | null }>
): boolean {
  return items.some((item) => resolveIsPreOrder(item));
}

/** Order status after payment when the cart includes waitlist / pre-order items. */
export const PREORDER_STATUS = "preorder" as const;

export function paidStatusForCart(
  items: Array<{ isPreOrder?: boolean | null; productSlug?: string | null }>
): "paid" | typeof PREORDER_STATUS {
  return cartHasPreOrder(items) ? PREORDER_STATUS : "paid";
}
