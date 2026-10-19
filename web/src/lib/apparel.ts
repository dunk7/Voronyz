export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const APPAREL_ONE_SIZE = ["One Size"] as const;

/**
 * Apparel sub-sections.
 * - `collection`: multi-product listing pages (shirts, sweaters, …) —
 *   add new designs to APPAREL_CATALOG with the matching subcategory.
 * - `standalone`: Accessories only (shades, jewelry, drone parts, …) — never mixed
 *   into clothing collections, and never shown on Engineering `/accessories`.
 */
export type ApparelSubcategoryId =
  | "shirts"
  | "sweaters"
  | "accessories";

/** Legacy apparel collection paths that now live under Accessories. */
export const LEGACY_APPAREL_ACCESSORY_SUBCATEGORIES = ["hats", "bottles"] as const;

/** Retired clothing sections with no remaining listings. */
export const LEGACY_REMOVED_APPAREL_SUBCATEGORIES = [
  "shorts",
  "joggers",
  "outerwear",
  "sweats",
  "pants",
  "scarves",
  "socks",
] as const;

export type ApparelListingKind = "collection" | "standalone";

export type ApparelSubcategory = {
  id: ApparelSubcategoryId;
  label: string;
  description: string;
  /** collection = multi-product PLP; standalone = Accessories tab products only */
  listing: ApparelListingKind;
};

/** Display order for Apparel hub and nav. */
export const APPAREL_SUBCATEGORIES: ApparelSubcategory[] = [
  {
    id: "shirts",
    label: "Shirts",
    description: "Equip the aura. Oversized tees built to throw on and keep the swag loud.",
    listing: "collection",
  },
  {
    id: "sweaters",
    label: "Sweaters",
    description:
      "Voronyz comfort, not just in the shoes. Generous fit that goes with everything — durable, easy on the body, warm without running hot.",
    listing: "collection",
  },
  {
    id: "accessories",
    label: "Accessories",
    description: "Shades, jewelry, lace locks, and drone parts",
    listing: "standalone",
  },
];

/** Multi-product apparel sub-sections only (excludes standalone accessories). */
export const APPAREL_COLLECTION_SUBCATEGORIES = APPAREL_SUBCATEGORIES.filter(
  (item) => item.listing === "collection",
);

/** Live hoodie listing — size changes the paid price and the advertised compare-at. */
export const CORE_HOODIE_SLUG = "voronyz-core-hoodie";
export const HOODIE_DEFAULT_SIZE = "M";
/** Paid hoodie price never drops below this, even after the advertised slash. */
export const HOODIE_MIN_SALE_CENTS = 7000;

export type ApparelPriceOffer = {
  /** Amount charged (sale / after advertised discount). */
  priceCents: number;
  /** Inflated “was” price shown struck through. */
  compareAtCents: number;
  percentOff: number;
};

/**
 * Hoodie size ladder: marked-up compare-at, then ~55–62% off so the paid
 * price lands in the $74–$99 range (never under $70).
 */
const HOODIE_SIZE_PRICES: Record<string, { priceCents: number; compareAtCents: number }> = {
  XS: { priceCents: 7400, compareAtCents: 18500 }, // 60% off
  S: { priceCents: 7800, compareAtCents: 19500 }, // 60% off
  M: { priceCents: 8400, compareAtCents: 21000 }, // 60% off
  L: { priceCents: 9000, compareAtCents: 22500 }, // 60% off
  XL: { priceCents: 9600, compareAtCents: 22900 }, // 58% off
  XXL: { priceCents: 9900, compareAtCents: 24900 }, // 60% off
};

export function isCoreHoodieSlug(slug: string | null | undefined): boolean {
  return (slug || "").trim().toLowerCase() === CORE_HOODIE_SLUG;
}

function percentOffFrom(compareAtCents: number, priceCents: number): number {
  if (compareAtCents <= 0 || priceCents >= compareAtCents) return 0;
  return Math.round((1 - priceCents / compareAtCents) * 100);
}

function hoodieOfferFromRow(row: { priceCents: number; compareAtCents: number }): ApparelPriceOffer {
  const priceCents = Math.max(HOODIE_MIN_SALE_CENTS, row.priceCents);
  return {
    priceCents,
    compareAtCents: row.compareAtCents,
    percentOff: percentOffFrom(row.compareAtCents, priceCents),
  };
}

/** Size-based sale for The Atelier Hoodie. Other apparel returns null. */
export function getApparelSizeOffer(
  slug: string | null | undefined,
  size: string | null | undefined,
): ApparelPriceOffer | null {
  if (!isCoreHoodieSlug(slug)) return null;
  const key = (size || HOODIE_DEFAULT_SIZE).trim().toUpperCase();
  const row = HOODIE_SIZE_PRICES[key] ?? HOODIE_SIZE_PRICES[HOODIE_DEFAULT_SIZE];
  return hoodieOfferFromRow(row);
}

/** Listing / default hoodie deal (Medium). */
export function getApparelListingOffer(slug: string | null | undefined): ApparelPriceOffer | null {
  return getApparelSizeOffer(slug, HOODIE_DEFAULT_SIZE);
}

/**
 * Server-trusted unit price for checkout/cart. Hoodies charge the size sale
 * (not the struck-through compare-at). Other products return null.
 */
export function catalogOverrideUnitCents(
  slug: string | null | undefined,
  size: string | null | undefined,
): number | null {
  return getApparelSizeOffer(slug, size)?.priceCents ?? null;
}

export type ApparelCatalogItem = {
  slug: string;
  subcategory: ApparelSubcategoryId;
  name: string;
  description: string;
  priceCents: number;
  colors: string[];
  /**
   * Colors that stay listed but cannot be purchased (stock 0).
   * Shown as “Out of Stock” even on coming-soon / pre-order items.
   */
  outOfStockColors?: string[];
  sizes: string[];
  /**
   * When set, only these sizes can be purchased. Other `sizes` stay
   * listed as out of stock so shoppers can see what is missing.
   */
  availableSizes?: string[];
  /**
   * Per-size unit price. Omitted sizes use `priceCents` (typically Medium).
   */
  sizePriceCents?: Record<string, number>;
  /** Primary cover / thumbnail image. */
  image: string;
  /** Full gallery; defaults to `[image]` when omitted. */
  images?: string[];
  /**
   * Per-color gallery. Missing colors fall back to `images`.
   * Use this when a colorway needs its own mockup (e.g. white tee + black logo).
   */
  imagesByColor?: Record<string, string[]>;
  /**
   * Alias used by hoodie listings (front, then back). Selecting a swatch
   * swaps to that color’s shots without changing garment shape or design.
   */
  colorImages?: Record<string, string[]>;
  skuPrefix: string;
  /**
   * Coming-soon items are pre-orderable: customers pay now and join the
   * waitlist; we ship when the product lands (could be days or longer).
   */
  comingSoon: boolean;
};

export function getApparelImages(item: ApparelCatalogItem): string[] {
  if (item.images && item.images.length > 0) return [...item.images];
  return [item.image];
}

/** Gallery for a selected colorway, falling back to the default product photos. */
export function getApparelImagesForColor(
  item: ApparelCatalogItem,
  color?: string | null,
): string[] {
  if (color) {
    const key = color.trim().toLowerCase();
    const specific = item.imagesByColor?.[key] ?? item.colorImages?.[key];
    if (specific && specific.length > 0) return [...specific];
  }
  return getApparelImages(item);
}

/**
 * Portrait on-model shots that a centered square crop would clip at the head.
 * Keep the same square frame and pin the photo to the top so the model stays in view.
 */
const APPAREL_COVER_OBJECT_TOP = new Set<string>([]);

/** Tailwind object-position class for apparel photos shown with object-cover. */
export function apparelCoverObjectPositionClass(src: string): string {
  return APPAREL_COVER_OBJECT_TOP.has(src) ? "object-top" : "object-center";
}

/** Slugs removed from the live apparel catalog (cleaned up on ensure). */
export const OBSOLETE_APPAREL_SLUGS = [
  "voronyz-technical-pants",
  "voronyz-lounge-sweats",
  "voronyz-lattice-shoe-trees",
  "voronyz-charm-bracelet",
  "voronyz-keychain",
  "voronyz-necklace",
  "voronyz-rc-car-stickers",
  "voronyz-nice-shirt",
  "voronyz-shorts",
  "voronyz-joggers",
  "voronyz-shell-jacket",
  "voronyz-scarf",
  "voronyz-uv-hat",
  "voronyz-water-bottle",
  "voronyz-lock-squirt-bottle",
  "voronyz-performance-socks",
] as const;

/**
 * Source of truth for apparel products.
 * To add a new design: append an entry with the target subcategory
 * (e.g. `shirts`). Collection subcategories are built for many products each.
 */
export const APPAREL_CATALOG: ApparelCatalogItem[] = [
  // ── Shirts (multi-product) ──────────────────────────────────────────────
  // Oversized first: shirts listing order follows catalog order within the
  // shirts subcategory. Apparel hub listings follow this full-catalog order.
  {
    slug: "voronyz-oversized-tee",
    subcategory: "shirts",
    name: "Oversized Tee",
    description: "Built big on purpose — soft, roomy, and easy to wear.",
    priceCents: 4800,
    colors: ["black", "white", "grey"],
    outOfStockColors: ["grey"],
    sizes: [...APPAREL_SIZES],
    sizePriceCents: {
      XS: 4200,
      S: 4500,
      M: 4800,
      L: 5100,
      XL: 5400,
      XXL: 5700,
    },
    image: "/products/apparel/shirt-front.jpg",
    images: [
      "/products/apparel/shirt-front.jpg",
      "/products/apparel/shirt-back-blank.jpg",
    ],
    imagesByColor: {
      white: [
        "/products/apparel/shirt-front-white.jpg",
        "/products/apparel/shirt-back-blank-white.jpg",
      ],
    },
    skuPrefix: "APP-TEE",
    comingSoon: false,
  },
  // ── Sweaters (multi-product) ────────────────────────────────────────────
  {
    slug: CORE_HOODIE_SLUG,
    subcategory: "sweaters",
    name: "The Atelier Hoodie",
    description: "Heavyweight fleece hoodie with a clean, modern cut.",
    priceCents: HOODIE_SIZE_PRICES[HOODIE_DEFAULT_SIZE].priceCents,
    colors: ["grey", "white"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/hoodie-grey-front.jpg",
    images: [
      "/products/apparel/hoodie-grey-front.jpg",
      "/products/apparel/hoodie-grey-back.jpg",
    ],
    colorImages: {
      grey: [
        "/products/apparel/hoodie-grey-front.jpg",
        "/products/apparel/hoodie-grey-back.jpg",
      ],
      white: [
        "/products/apparel/hoodie-white-front.jpg",
        "/products/apparel/hoodie-white-back.jpg",
      ],
    },
    skuPrefix: "APP-HOOD",
    comingSoon: false,
  },
  // ── Accessories only (never mixed into clothing collections) ────────────
  // Lattice Insoles live on All Footwear as a live listing (see latticeInsoles.ts).
  {
    slug: "voronyz-cool-shades",
    subcategory: "accessories",
    name: "Cool Shades",
    description: "Lightweight 3D-printed frames with a sharp geometric silhouette.",
    priceCents: 4800,
    colors: ["black", "white", "grey"],
    outOfStockColors: ["grey"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/cool-shades.jpg",
    skuPrefix: "APP-SHDE",
    comingSoon: true,
  },
  {
    slug: "voronyz-jewelry-collab",
    subcategory: "accessories",
    name: "Jewelry Collab",
    description: "Limited jewelry collab drop — sculptural pieces from the Voronyz studio.",
    priceCents: 7200,
    colors: ["black", "gold"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/jewelry-collab.jpg",
    skuPrefix: "APP-JLRY",
    comingSoon: true,
  },
  {
    slug: "voronyz-drone-parts",
    subcategory: "accessories",
    name: "Drone Parts",
    description: "Precision 3D-printed drone mounts, guards, and frame accessories.",
    priceCents: 2800,
    colors: ["black", "grey"],
    outOfStockColors: ["grey"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/drone-parts.jpg",
    skuPrefix: "APP-DRNE",
    comingSoon: true,
  },
  {
    slug: "voronyz-lace-locks",
    subcategory: "accessories",
    name: "Lace Locks",
    description: "3D-printed lace locks that keep your footwear dialed without retying.",
    priceCents: 1600,
    colors: ["black", "white", "grey"],
    outOfStockColors: ["grey"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/lace-locks.jpg",
    skuPrefix: "APP-LACE",
    comingSoon: true,
  },
];

export const APPAREL_SLUGS = APPAREL_CATALOG.map((item) => item.slug);

export const APPAREL_CATEGORY = "apparel" as const;

export function isObsoleteApparelSlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  return (OBSOLETE_APPAREL_SLUGS as readonly string[]).includes(key);
}

export function isApparelSlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  return APPAREL_SLUGS.includes(key);
}

export function getApparelItem(slug: string | null | undefined) {
  const key = (slug || "").trim().toLowerCase();
  return APPAREL_CATALOG.find((item) => item.slug === key) ?? null;
}

/** In-memory product shape used when the catalog listing is known but the DB is unreachable. */
export function apparelCatalogProduct(item: ApparelCatalogItem) {
  const now = new Date(0);
  return {
    id: item.slug,
    slug: item.slug,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    currency: "usd",
    images: getApparelImages(item),
    primaryColors: [...item.colors],
    secondaryColors: [] as string[],
    sizes: [...item.sizes],
    variants: item.colors.map((color) => ({
      id: `${item.skuPrefix}-${color}`,
      color,
      sku: apparelSku(item.skuPrefix, color),
      stock: apparelVariantStock(item, color),
      priceCents: item.priceCents,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

export function getApparelSubcategory(id: string | null | undefined) {
  return APPAREL_SUBCATEGORIES.find((item) => item.id === id) ?? null;
}

export function isApparelSubcategoryId(
  id: string | null | undefined,
): id is ApparelSubcategoryId {
  return Boolean(getApparelSubcategory(id));
}

export function isLegacyApparelAccessorySubcategory(
  id: string | null | undefined,
): boolean {
  const key = (id || "").trim().toLowerCase();
  return (LEGACY_APPAREL_ACCESSORY_SUBCATEGORIES as readonly string[]).includes(key);
}

export function isLegacyRemovedApparelSubcategory(
  id: string | null | undefined,
): boolean {
  const key = (id || "").trim().toLowerCase();
  return (LEGACY_REMOVED_APPAREL_SUBCATEGORIES as readonly string[]).includes(key);
}

export function isCollectionSubcategory(id: string | null | undefined): boolean {
  return getApparelSubcategory(id)?.listing === "collection";
}

export function isStandaloneSubcategory(id: string | null | undefined): boolean {
  return getApparelSubcategory(id)?.listing === "standalone";
}

/** All catalog items in a subcategory (ordered as in APPAREL_CATALOG). */
export function getApparelBySubcategory(id: ApparelSubcategoryId): ApparelCatalogItem[] {
  return APPAREL_CATALOG.filter((item) => item.subcategory === id);
}

export function getStandaloneApparelItems(): ApparelCatalogItem[] {
  return APPAREL_CATALOG.filter(
    (item) => getApparelSubcategory(item.subcategory)?.listing === "standalone",
  );
}

/** Cover image for a subcategory hub card (first product image). */
export function getSubcategoryCover(id: ApparelSubcategoryId): string | null {
  return getApparelBySubcategory(id)[0]?.image ?? null;
}

/** Listing URL for a subcategory (`/apparel/shirts`, `/apparel/accessories`, …). */
export function apparelSubcategoryHref(id: ApparelSubcategoryId): string {
  return `/apparel/${id}`;
}

/**
 * Back-link target for a product detail page.
 * Clothing listings (tees, hoodies) return to the Apparel hub; accessories
 * stay on their own Accessories listing.
 */
export function apparelProductShopHref(slug: string | null | undefined): string {
  const item = getApparelItem(slug);
  if (!item) return "/apparel";
  if (getApparelSubcategory(item.subcategory)?.listing === "standalone") {
    return apparelSubcategoryHref(item.subcategory);
  }
  return "/apparel";
}

export function apparelProductShopLabel(slug: string | null | undefined): string {
  const item = getApparelItem(slug);
  if (!item) return "Back to Apparel";
  const sub = getApparelSubcategory(item.subcategory);
  if (sub?.listing === "standalone") return "Back to Accessories";
  return "Back to Apparel";
}

export function apparelSku(prefix: string, color: string) {
  const code = color.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "CLR";
  return `${prefix}-${code}`;
}

function normalizeApparelColor(color: string) {
  return color.trim().toLowerCase();
}

/** True when a catalog color is explicitly marked out of stock. */
export function isApparelColorOutOfStock(
  item: ApparelCatalogItem,
  color: string,
): boolean {
  const key = normalizeApparelColor(color);
  return (item.outOfStockColors ?? []).some(
    (entry) => normalizeApparelColor(entry) === key,
  );
}

/**
 * Variant stock written to the DB. Coming-soon pieces stay at 0 (pre-order
 * path) unless a color is also listed as out of stock — same 0, but the
 * product page treats those colors as unbuyable.
 */
export function apparelVariantStock(
  item: ApparelCatalogItem,
  color: string,
): number {
  if (isApparelColorOutOfStock(item, color)) return 0;
  return item.comingSoon ? 0 : 999;
}

export function isApparelSizeAvailable(
  item: ApparelCatalogItem,
  size: string,
): boolean {
  if (!item.sizes.includes(size)) return false;
  if (!item.availableSizes || item.availableSizes.length === 0) return true;
  return item.availableSizes.includes(size);
}

/** Sizes that stay listed but cannot be purchased. */
export function apparelUnavailableSizes(item: ApparelCatalogItem): string[] {
  if (!item.availableSizes || item.availableSizes.length === 0) return [];
  return item.sizes.filter((size) => !item.availableSizes!.includes(size));
}

/** Unit price for a catalog size. Medium / omitted sizes use `priceCents`. */
export function apparelPriceCentsForSize(
  item: ApparelCatalogItem,
  size?: string | null,
): number {
  if (!size) return item.priceCents;
  const keyed = item.sizePriceCents?.[size];
  return typeof keyed === "number" && keyed > 0 ? keyed : item.priceCents;
}

/**
 * Checkout/cart unit price: apparel size map when present, otherwise the
 * database (or cart) fallback. Non-apparel slugs pass through unchanged.
 */
export function catalogUnitPriceCents(args: {
  productSlug?: string | null;
  size?: string | null;
  fallbackCents: number;
}): number {
  const override = catalogOverrideUnitCents(args.productSlug, args.size);
  if (override != null) return override;
  const item = getApparelItem(args.productSlug);
  if (!item) return args.fallbackCents;
  return apparelPriceCentsForSize(item, args.size);
}
