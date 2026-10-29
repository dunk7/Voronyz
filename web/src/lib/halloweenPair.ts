/**
 * Halloween pair: one extra item per order is 50% off.
 * Fifty units still discount a single unit. The next order can use it again.
 * Active Oct 24–Nov 1, 2026 (Pacific).
 */

export const HALLOWEEN_PAIR_STORAGE_KEY = "voronyz-halloween-pair-2026";
export const HALLOWEEN_PAIR_EVENT = "voronyz-halloween-pair";
export const HALLOWEEN_PAIR_LABEL = "Halloween pair · 50% off";

const SEASON_YEAR = 2026;

type PricedQty = {
  quantity: number;
  unitCents: number;
};

export function isHalloweenPairSeason(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (year !== SEASON_YEAR) return false;
  if (month === 10 && day >= 24) return true;
  if (month === 11 && day === 1) return true;
  return false;
}

export function readHalloweenPairOptIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HALLOWEEN_PAIR_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeHalloweenPairOptIn(): void {
  try {
    window.localStorage.setItem(HALLOWEEN_PAIR_STORAGE_KEY, "on");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(HALLOWEEN_PAIR_EVENT));
}

export function halfOffUnitCents(unitCents: number): number {
  if (!Number.isFinite(unitCents) || unitCents <= 0) return 0;
  return Math.floor(unitCents / 2);
}

/**
 * Cheapest paid unit, when the order has at least two paid units.
 * Ties go to the later line — the additional item, not the first one.
 * `freeLineIndex` drops one unit (already free) so it is not halved.
 */
export function getHalloweenPairTarget(
  lines: readonly PricedQty[],
  freeLineIndex = -1
): { index: number; savingsCents: number } | null {
  let paidUnits = 0;
  let bestIndex = -1;
  let bestCents = Number.POSITIVE_INFINITY;

  for (let i = 0; i < lines.length; i++) {
    const unit = lines[i]?.unitCents ?? 0;
    let qty = lines[i]?.quantity ?? 0;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    if (i === freeLineIndex) qty -= 1;
    if (qty <= 0) continue;
    if (!Number.isFinite(unit) || unit <= 0) continue;
    paidUnits += qty;
    if (unit < bestCents || (unit === bestCents && i > bestIndex)) {
      bestCents = unit;
      bestIndex = i;
    }
  }

  if (paidUnits < 2 || bestIndex < 0) return null;
  const half = halfOffUnitCents(bestCents);
  return { index: bestIndex, savingsCents: bestCents - half };
}

export function applyHalloweenPairToQuantityPricedLines<T extends PricedQty>(
  lines: T[],
  freeLineIndex = -1
): T[] {
  const target = getHalloweenPairTarget(lines, freeLineIndex);
  if (!target) return lines;
  const item = lines[target.index];
  const half = halfOffUnitCents(item.unitCents);
  const qty = item.quantity > 0 ? item.quantity : 1;
  if (qty === 1) {
    lines[target.index] = { ...item, unitCents: half };
    return lines;
  }
  lines[target.index] = { ...item, quantity: qty - 1 };
  lines.splice(target.index + 1, 0, { ...item, quantity: 1, unitCents: half });
  return lines;
}

type StripeLikePricedLine = {
  quantity?: number;
  price_data?: {
    unit_amount?: number;
    product_data?: {
      name?: string;
      description?: string;
    };
  };
};

export function applyHalloweenPairToStripeLineItems<T extends StripeLikePricedLine>(
  lineItems: T[]
): T[] {
  const priced = lineItems.map((line) => ({
    quantity: line.quantity && line.quantity > 0 ? line.quantity : 0,
    unitCents: line.price_data?.unit_amount ?? 0,
  }));
  const target = getHalloweenPairTarget(priced);
  if (!target) return lineItems;
  const item = lineItems[target.index];
  if (!item.price_data) return lineItems;
  const half = halfOffUnitCents(item.price_data.unit_amount ?? 0);
  const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
  const note = (description?: string) =>
    [description, HALLOWEEN_PAIR_LABEL].filter(Boolean).join(" — ");

  if (qty === 1) {
    item.price_data.unit_amount = half;
    if (item.price_data.product_data) {
      item.price_data.product_data.description = note(item.price_data.product_data.description);
    }
    return lineItems;
  }

  item.quantity = qty - 1;
  const productData = item.price_data.product_data
    ? { ...item.price_data.product_data }
    : {};
  const halfLine = {
    ...item,
    quantity: 1,
    price_data: {
      ...item.price_data,
      unit_amount: half,
      product_data: {
        ...productData,
        name: productData.name || "Item",
        description: note(productData.description),
      },
    },
  } as T;
  lineItems.splice(target.index + 1, 0, halfLine);
  return lineItems;
}
