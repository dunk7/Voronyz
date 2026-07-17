/** Optional shipping insurance: $25 per shipped item. */

export const SHIPPING_INSURANCE_CENTS_PER_ITEM = 2500;

export const SHIPPING_INSURANCE_PRODUCT_NAME = "Shipping Insurance";

export const SHIPPING_INSURANCE_DESCRIPTION =
  "Covers loss or damage while your order is in transit. Shipping itself remains free.";

type InsurableCartItem = {
  quantity?: number;
  fulfillment?: string | null;
  attributes?: { fulfillment?: string | null } | null;
};

function itemFulfillment(item: InsurableCartItem): string | null | undefined {
  return item.fulfillment ?? item.attributes?.fulfillment;
}

/** Items fulfilled via Magikid Lab pickup are not shipped and are not insurable. */
export function isInsurableCartItem(item: InsurableCartItem): boolean {
  return itemFulfillment(item) !== "pickup";
}

/** Total quantity of items that can be covered by shipping insurance. */
export function getInsurableItemQuantity(items: InsurableCartItem[]): number {
  return items.reduce((sum, item) => {
    if (!isInsurableCartItem(item)) return sum;
    const qty = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 0;
    return sum + qty;
  }, 0);
}

export function cartHasInsurableItems(items: InsurableCartItem[]): boolean {
  return getInsurableItemQuantity(items) > 0;
}

/** Cost in cents when insurance is selected ($25 × insurable quantity). */
export function getShippingInsuranceCents(items: InsurableCartItem[]): number {
  return getInsurableItemQuantity(items) * SHIPPING_INSURANCE_CENTS_PER_ITEM;
}

export function isShippingInsuranceRequested(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function buildShippingInsuranceLineItem(quantity: number) {
  return {
    name: SHIPPING_INSURANCE_PRODUCT_NAME,
    quantity,
    unitCents: SHIPPING_INSURANCE_CENTS_PER_ITEM,
    amount: SHIPPING_INSURANCE_CENTS_PER_ITEM,
    description: SHIPPING_INSURANCE_DESCRIPTION,
  };
}
