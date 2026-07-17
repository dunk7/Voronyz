export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type ApparelSubcategoryId =
  | "socks"
  | "hoodies"
  | "sweats"
  | "shirts"
  | "pants"
  | "outerwear";

export type ApparelSubcategory = {
  id: ApparelSubcategoryId;
  label: string;
  description: string;
};

/** Display order: Socks first, then Hoodies, Sweats, Shirts, Pants, Outerwear. */
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
    description: "Sweatpants, sweatshirts, and lounge sets",
  },
  {
    id: "shirts",
    label: "Shirts",
    description: "Tees and oversized shirts",
  },
  {
    id: "pants",
    label: "Pants",
    description: "Everyday and technical pants",
  },
  {
    id: "outerwear",
    label: "Outerwear",
    description: "Shells, jackets, and weather layers",
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
  image: string;
  skuPrefix: string;
};

export const APPAREL_CATALOG: ApparelCatalogItem[] = [
  {
    slug: "voronyz-performance-socks",
    subcategory: "socks",
    name: "Performance Socks",
    description: "Cushioned crew socks built for all-day wear and recovery.",
    priceCents: 2800,
    colors: ["black", "grey", "white"],
    sizes: ["S", "M", "L", "XL"],
    image: "/products/apparel/socks.jpg",
    skuPrefix: "APP-SOCK",
  },
  {
    slug: "voronyz-core-hoodie",
    subcategory: "hoodies",
    name: "Core Hoodie",
    description: "Heavyweight fleece hoodie with a clean, modern cut.",
    priceCents: 7800,
    colors: ["black", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/hoodie.jpg",
    skuPrefix: "APP-HOOD",
  },
  {
    slug: "voronyz-lounge-sweats",
    subcategory: "sweats",
    name: "Lounge Sweats",
    description: "Tapered sweatpants for training days and downtime.",
    priceCents: 7200,
    colors: ["black", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/sweats.jpg",
    skuPrefix: "APP-SWT",
  },
  {
    slug: "voronyz-oversized-tee",
    subcategory: "shirts",
    name: "Oversized Tee",
    description: "Relaxed oversized shirt with a soft hand-feel and clean drape.",
    priceCents: 4800,
    colors: ["black", "white", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/shirt.jpg",
    skuPrefix: "APP-TEE",
  },
  {
    slug: "voronyz-technical-pants",
    subcategory: "pants",
    name: "Technical Pants",
    description: "Streamlined pants with a sharp taper and everyday stretch.",
    priceCents: 8800,
    colors: ["black", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/pants.jpg",
    skuPrefix: "APP-PNT",
  },
  {
    slug: "voronyz-shell-jacket",
    subcategory: "outerwear",
    name: "Shell Jacket",
    description: "Lightweight outerwear shell for commuting and cool weather.",
    priceCents: 12800,
    colors: ["black", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/outerwear.jpg",
    skuPrefix: "APP-OUT",
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
