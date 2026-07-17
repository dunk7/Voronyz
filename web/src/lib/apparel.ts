export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const APPAREL_ONE_SIZE = ["One Size"] as const;

export type ApparelSubcategoryId =
  | "socks"
  | "hoodies"
  | "sweats"
  | "shirts"
  | "shorts"
  | "pants"
  | "outerwear"
  | "accessories";

export type ApparelSubcategory = {
  id: ApparelSubcategoryId;
  label: string;
  description: string;
};

/** Display order: Socks first, then core layers, shirts, bottoms, outerwear, accessories. */
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
    id: "pants",
    label: "Pants",
    description: "Everyday and technical pants",
  },
  {
    id: "outerwear",
    label: "Outerwear",
    description: "Shells, jackets, and weather layers",
  },
  {
    id: "accessories",
    label: "Accessories",
    description: "Insoles, shades, jewelry, keychains, drone & RC gear",
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
export const OBSOLETE_APPAREL_SLUGS = [] as const;

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
    slug: "voronyz-technical-pants",
    subcategory: "pants",
    name: "Technical Pants",
    description: "Streamlined pants with a sharp taper and everyday stretch.",
    priceCents: 8800,
    colors: ["black", "grey"],
    sizes: [...APPAREL_SIZES],
    image: "/products/apparel/pants.jpg",
    skuPrefix: "APP-PNT",
    comingSoon: true,
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
  {
    slug: "voronyz-lattice-insoles",
    subcategory: "accessories",
    name: "Lattice Insoles",
    description: "3D-printed TPU lattice insoles for cushion, bounce, and all-day support.",
    priceCents: 3200,
    colors: ["black", "grey"],
    sizes: ["S", "M", "L", "XL"],
    image: "/products/apparel/lattice-insoles.jpg",
    skuPrefix: "APP-INSL",
    comingSoon: true,
  },
  {
    slug: "voronyz-cool-shades",
    subcategory: "accessories",
    name: "Cool Shades",
    description: "Lightweight 3D-printed frames with a sharp geometric silhouette.",
    priceCents: 4800,
    colors: ["black", "white", "grey"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/cool-shades.jpg",
    skuPrefix: "APP-SHDE",
    comingSoon: true,
  },
  {
    slug: "voronyz-necklace",
    subcategory: "accessories",
    name: "Voronyz Necklace",
    description: "Faceted Voronyz pendant on a clean chain — printed jewelry with everyday weight.",
    priceCents: 5400,
    colors: ["black", "gold", "silver"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/voronyz-necklace.jpg",
    skuPrefix: "APP-NCKL",
    comingSoon: true,
  },
  {
    slug: "voronyz-keychain",
    subcategory: "accessories",
    name: "Voronyz Keychain",
    description: "Durable 3D-printed keychain mark — pocket-ready Voronyz branding.",
    priceCents: 1800,
    colors: ["black", "grey", "orange"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/voronyz-keychain.jpg",
    skuPrefix: "APP-KEY",
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
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/drone-parts.jpg",
    skuPrefix: "APP-DRNE",
    comingSoon: true,
  },
  {
    slug: "voronyz-rc-car-stickers",
    subcategory: "accessories",
    name: "RC Car Stickers",
    description: "Vinyl RC car sticker pack with Voronyz marks and lattice motifs.",
    priceCents: 1200,
    colors: ["black", "white", "orange"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/rc-car-stickers.jpg",
    skuPrefix: "APP-RCST",
    comingSoon: true,
  },
  {
    slug: "voronyz-lace-locks",
    subcategory: "accessories",
    name: "Lace Locks",
    description: "3D-printed lace locks that keep your footwear dialed without retying.",
    priceCents: 1600,
    colors: ["black", "white", "grey"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/lace-locks.jpg",
    skuPrefix: "APP-LACE",
    comingSoon: true,
  },
  {
    slug: "voronyz-charm-bracelet",
    subcategory: "accessories",
    name: "Charm Bracelet",
    description: "Modular charm bracelet with interchangeable Voronyz lattice charms.",
    priceCents: 4600,
    colors: ["black", "silver"],
    sizes: [...APPAREL_ONE_SIZE],
    image: "/products/apparel/charm-bracelet.jpg",
    skuPrefix: "APP-CHAR",
    comingSoon: true,
  },
  {
    slug: "voronyz-lattice-shoe-trees",
    subcategory: "accessories",
    name: "Lattice Shoe Trees",
    description: "Breathable 3D-printed shoe trees that hold shape and air out your pairs.",
    priceCents: 3400,
    colors: ["black", "white"],
    sizes: ["S", "M", "L"],
    image: "/products/apparel/lattice-shoe-trees.jpg",
    skuPrefix: "APP-TREE",
    comingSoon: true,
  },
];

export const APPAREL_SLUGS = APPAREL_CATALOG.map((item) => item.slug);

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

export function getApparelSubcategory(id: string | null | undefined) {
  return APPAREL_SUBCATEGORIES.find((item) => item.id === id) ?? null;
}

export function apparelSku(prefix: string, color: string) {
  const code = color.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "CLR";
  return `${prefix}-${code}`;
}
