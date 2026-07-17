export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const APPAREL_ONE_SIZE = ["One Size"] as const;

export type ApparelSubcategoryId =
  | "socks"
  | "hoodies"
  | "sweats"
  | "shirts"
  | "shorts"
  | "accessories";

export type ApparelSubcategory = {
  id: ApparelSubcategoryId;
  label: string;
  description: string;
};

/** Display order: Socks first, then core layers, shirts, shorts, accessories. */
export const APPAREL_SUBCATEGORIES: ApparelSubcategory[] = [
  {
    id: "socks",
    label: "Socks",
    description: "Performance and everyday socks",
  },
  {
    id: "hoodies",
    label: "Hoodies",
    description: "Layered comfort with a clean silhouette",
  },
  {
    id: "sweats",
    label: "Sweats",
    description: "Sweatpants and lounge bottoms",
  },
  {
    id: "shirts",
    label: "Shirts",
    description: "Nice shirts and oversized tees",
  },
  {
    id: "shorts",
    label: "Shorts",
    description: "Everyday and training shorts",
  },
  {
    id: "accessories",
    label: "Accessories",
    description: "Scarves, UV hats, and bottles",
  },
];

export type ApparelCatalogItem = {
  slug: string;
  subcategory: ApparelSubcategoryId;
  name: string;
  description: string;
  priceCents: number;
  colors: string[];
  sizes: string[];
  /** Primary cover / thumbnail image. */
  image: string;
  /** Full gallery; defaults to `[image]` when omitted. */
  images?: string[];
  skuPrefix: string;
  /** Apparel drops are previewable but not purchasable yet. */
  comingSoon: true;
};

export function getApparelImages(item: ApparelCatalogItem): string[] {
  if (item.images && item.images.length > 0) return [...item.images];
  return [item.image];
}

/** Slugs removed from the live apparel catalog (cleaned up on ensure). */
export const OBSOLETE_APPAREL_SLUGS = [
  "voronyz-technical-pants",
  "voronyz-shell-jacket",
] as const;

export const APPAREL_CATALOG: ApparelCatalogItem[] = [
  {
    slug: "voronyz-performance-socks",
    subcategory: "socks",
    name: "Socks",
    description: "Cushioned crew socks built for all-day wear and recovery.",
    priceCents: 2800,
    colors: ["black", "grey", "white"],
    sizes: ["S", "M", "L", "XL"],
    image: "/products/apparel/socks-features.jpg",
    images: [
      "/products/apparel/socks-features.jpg",
      "/products/apparel/socks.jpg",
    ],
    skuPrefix: "APP-SOCK",
    comingSoon: true,
  },
  {
    slug: "voronyz-scarf",
    subcategory: "accessories",
    name: "Scarf",
    description: "Soft knit scarf with a clean drape for cool-weather layers.",
    priceCents: 4200,
    colors: ["black", "grey"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/scarf.jpg",
    skuPrefix: "APP-SCRF",
    comingSoon: true,
  },
  {
    slug: "voronyz-shorts",
    subcategory: "shorts",
    name: "Shorts",
    description: "Lightweight shorts with a relaxed athletic fit.",
    priceCents: 5800,
    colors: ["black", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/shorts.jpg",
    skuPrefix: "APP-SHRT",
    comingSoon: true,
  },
  {
    slug: "voronyz-core-hoodie",
    subcategory: "hoodies",
    name: "Hoodie",
    description: "Heavyweight fleece hoodie with a clean, modern cut.",
    priceCents: 7800,
    colors: ["black", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/hoodie.jpg",
    skuPrefix: "APP-HOOD",
    comingSoon: true,
  },
  {
    slug: "voronyz-nice-shirt",
    subcategory: "shirts",
    name: "Nice Shirt",
    description: "Polished everyday shirt with a sharp collar and soft hand-feel.",
    priceCents: 6800,
    colors: ["black", "white", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/nice-shirt.jpg",
    skuPrefix: "APP-NICE",
    comingSoon: true,
  },
  {
    slug: "voronyz-lounge-sweats",
    subcategory: "sweats",
    name: "Sweats",
    description: "Tapered sweatpants for training days and downtime.",
    priceCents: 7200,
    colors: ["black", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/sweats.jpg",
    skuPrefix: "APP-SWT",
    comingSoon: true,
  },
  {
    slug: "voronyz-oversized-tee",
    subcategory: "shirts",
    name: "Oversized Shirt",
    description: "Relaxed oversized shirt with a soft hand-feel and clean drape.",
    priceCents: 4800,
    colors: ["black", "white", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/shirt.jpg",
    skuPrefix: "APP-TEE",
    comingSoon: true,
  },
  {
    slug: "voronyz-uv-hat",
    subcategory: "accessories",
    name: "UV Hat",
    description: "Wide-brim UV hat for sun coverage on long outdoor days.",
    priceCents: 3800,
    colors: ["black", "beige"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/uv-hat.jpg",
    skuPrefix: "APP-UVHT",
    comingSoon: true,
  },
  {
    slug: "voronyz-water-bottle",
    subcategory: "accessories",
    name: "Water Bottle",
    description: "Insulated stainless bottle with a clean Voronyz finish.",
    priceCents: 3600,
    colors: ["black", "white"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/water-bottle.jpg",
    skuPrefix: "APP-BTTL",
    comingSoon: true,
  },
];

export const APPAREL_SLUGS = APPAREL_CATALOG.map((item) => item.slug);

export function isApparelSlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  return APPAREL_SLUGS.includes(key);
}

export function getApparelItem(slug: string | null | undefined) {
  const key = (slug || "").trim().toLowerCase();
  return APPAREL_CATALOG.find((item) => item.slug === key) ?? null;
}

export function getApparelSubcategory(id: string | null | undefined) {
  return APPAREL_SUBCATEGORIES.find((item) => item.id === id) ?? null;
}

export function apparelSku(prefix: string, color: string) {
  const code = color.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "CLR";
  return `${prefix}-${code}`;
}
