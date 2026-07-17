export const TRAIL_MIX_SLUG = "antioxidant-trail-mix";
export const TRAIL_MIX_NAME = "Antioxidant Trail Mix";
export const TRAIL_MIX_PRICE_CENTS = 6000; // $60
export const TRAIL_MIX_THUMBNAIL_URL =
  "/products/antioxidant-trail-mix/antioxidant-trail-mix.jpg";

export const TRAIL_MIX_DESCRIPTION_SHORT =
  "Antioxidant-packed trail mix in Wild Berry, Super Protein, and Chocolate — currently sold out.";

export const TRAIL_MIX_DESCRIPTION =
  "A premium antioxidant trail mix built for everyday fuel. Three flavor profiles — Wild Berry, Super Protein, and Chocolate — packed with nutrient-dense ingredients. Currently sold out while we restock the next batch.";

export const TRAIL_MIX_HOW_ITS_MADE =
  "Each bag is blended for clean energy and recovery: antioxidant-rich berries, protein-forward nuts and seeds, and a chocolate option for a richer finish. Bags are sealed for freshness and portioned for daily use. All flavors are sold out right now — check back soon.";

export const TRAIL_MIX_IMAGES = [TRAIL_MIX_THUMBNAIL_URL] as const;

export type TrailMixFlavorId = "wild-berry" | "super-protein" | "chocolate";

export type TrailMixFlavor = {
  id: TrailMixFlavorId;
  label: string;
  description: string;
};

export const TRAIL_MIX_FLAVORS: TrailMixFlavor[] = [
  {
    id: "wild-berry",
    label: "Wild Berry",
    description: "Bright berry blend with antioxidant-rich dried fruit",
  },
  {
    id: "super-protein",
    label: "Super Protein",
    description: "Nut-and-seed heavy mix for lasting fuel",
  },
  {
    id: "chocolate",
    label: "Chocolate",
    description: "Dark chocolate pieces with roasted crunch",
  },
];

export const TRAIL_MIX_FLAVOR_IDS = TRAIL_MIX_FLAVORS.map((f) => f.id);

/** No footwear sizes — flavors are selected instead. */
export const TRAIL_MIX_SIZES = ["One Size"] as const;

export const TRAIL_MIX_VARIANTS = [
  { color: "wild-berry", sku: "ATM-WB", stock: 0 },
  { color: "super-protein", sku: "ATM-SP", stock: 0 },
  { color: "chocolate", sku: "ATM-CH", stock: 0 },
] as const;

export function trailMixFlavorLabel(id: string | null | undefined): string {
  return TRAIL_MIX_FLAVORS.find((f) => f.id === id)?.label ?? id ?? "";
}

export type HealthListProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[] | null;
  thumbnail?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

/** Instant Collaborative seed so Trail Mix never flashes empty while the API loads. */
export function getHealthCatalogSeed(): HealthListProduct[] {
  const now = new Date().toISOString();
  return [
    {
      id: `catalog-${TRAIL_MIX_SLUG}`,
      slug: TRAIL_MIX_SLUG,
      name: TRAIL_MIX_NAME,
      description: TRAIL_MIX_DESCRIPTION_SHORT,
      priceCents: TRAIL_MIX_PRICE_CENTS,
      currency: "usd",
      images: [...TRAIL_MIX_IMAGES],
      thumbnail: TRAIL_MIX_THUMBNAIL_URL,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
