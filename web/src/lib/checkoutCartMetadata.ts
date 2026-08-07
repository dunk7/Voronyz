import { resolveIsPreOrder } from "@/lib/preorder";

/** Stripe Checkout Session metadata values max out at 500 characters. */
export const STRIPE_METADATA_VALUE_LIMIT = 500;

export type CheckoutCartItemInput = {
  variantId?: string;
  productName?: string;
  variantName?: string;
  secondaryColor?: string;
  size?: string;
  gender?: string;
  fulfillment?: string;
  quantity?: number;
  priceCents?: number;
  image?: string;
  productSlug?: string;
  studentName?: string;
  isPreOrder?: boolean | null;
  [key: string]: unknown;
};

type CompactCartRow = Record<string, string | number | boolean>;

function toCompactRow(item: CheckoutCartItemInput): CompactCartRow {
  const row: CompactCartRow = {};
  if (item.variantId) row.variantId = String(item.variantId);
  if (item.productName) row.productName = String(item.productName);
  if (item.variantName) row.variantName = String(item.variantName);
  if (item.secondaryColor) row.secondaryColor = String(item.secondaryColor);
  if (item.size) row.size = String(item.size);
  if (item.gender) row.gender = String(item.gender);
  if (item.fulfillment) row.fulfillment = String(item.fulfillment);
  if (typeof item.quantity === "number") row.quantity = item.quantity;
  if (typeof item.priceCents === "number") row.priceCents = item.priceCents;
  if (item.productSlug) row.productSlug = String(item.productSlug);
  if (item.studentName) row.studentName = String(item.studentName);
  if (
    resolveIsPreOrder({
      isPreOrder: item.isPreOrder,
      productSlug: item.productSlug,
    })
  ) {
    row.isPreOrder = true;
  }
  return row;
}

function toMinimalRow(row: CompactCartRow): CompactCartRow {
  const next: CompactCartRow = {};
  if (row.variantId) next.variantId = row.variantId;
  if (typeof row.quantity === "number") next.quantity = row.quantity;
  if (typeof row.priceCents === "number") next.priceCents = row.priceCents;
  if (row.size) next.size = row.size;
  if (row.gender) next.gender = row.gender;
  if (row.productSlug) next.productSlug = row.productSlug;
  if (row.studentName) next.studentName = row.studentName;
  if (row.isPreOrder) next.isPreOrder = true;
  if (row.fulfillment) next.fulfillment = row.fulfillment;
  if (row.secondaryColor) next.secondaryColor = row.secondaryColor;
  return next;
}

/**
 * Compact cart payload for Stripe session metadata.
 * Omits images/extra fields and drops empty values so multi-item
 * (especially pre-order apparel) carts stay under the 500-char limit.
 * Always returns valid JSON parseable by confirm/webhook handlers.
 */
export function buildStripeCartItemsMetadata(
  items: CheckoutCartItemInput[]
): string {
  const compact = items.map(toCompactRow);

  let json = JSON.stringify(compact);
  if (json.length <= STRIPE_METADATA_VALUE_LIMIT) return json;

  // Drop display-only fields first so order fulfillment still has IDs/sizes.
  const slimmer = compact.map((row) => {
    const next = { ...row };
    delete next.productName;
    delete next.variantName;
    return next;
  });
  json = JSON.stringify(slimmer);
  if (json.length <= STRIPE_METADATA_VALUE_LIMIT) return json;

  // Keep only what confirm/webhook need to rebuild the order.
  const minimal = compact.map(toMinimalRow);
  json = JSON.stringify(minimal);
  if (json.length <= STRIPE_METADATA_VALUE_LIMIT) return json;

  // Too large even when minimal — leave cartItems empty so confirm/webhook
  // fall back to Stripe line items (avoids a partial cart that under-counts).
  return "[]";
}

/** Only HTTPS image URLs are valid for Stripe Checkout product images. */
export function stripeHttpsImages(urls: string[]): string[] {
  return urls.filter((url) => /^https:\/\//i.test(url)).slice(0, 8);
}
