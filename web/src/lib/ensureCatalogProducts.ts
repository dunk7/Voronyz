import { prisma } from "@/lib/prisma";
import { MAGIKID_SHOES_THUMBNAIL_URL, MAGIKID_SHOES_KIDS_SIZES, MAGIKID_SHOES_DESCRIPTION_SHORT, MAGIKID_SHOES_BASE_PRICE_CENTS } from "@/lib/magikidShoesThumbnail";
import {
  TRAIL_MIX_DESCRIPTION_SHORT,
  TRAIL_MIX_FLAVOR_IDS,
  TRAIL_MIX_IMAGES,
  TRAIL_MIX_NAME,
  TRAIL_MIX_PRICE_CENTS,
  TRAIL_MIX_SIZES,
  TRAIL_MIX_SLUG,
  TRAIL_MIX_VARIANTS,
} from "@/lib/trailMix";
import {
  VIOLETTE_PONYBEAD_ANIMAL_IDS,
  VIOLETTE_PONYBEAD_DESCRIPTION_SHORT,
  VIOLETTE_PONYBEAD_IMAGES,
  VIOLETTE_PONYBEAD_NAME,
  VIOLETTE_PONYBEAD_PRICE_CENTS,
  VIOLETTE_PONYBEAD_SIZES,
  VIOLETTE_PONYBEAD_SLUG,
  VIOLETTE_PONYBEAD_VARIANTS,
} from "@/lib/violettePonybeadAnimals";
import {
  GATORS_DESCRIPTION_SHORT,
  GATORS_IMAGES,
  GATORS_NAME,
  GATORS_PRICE_CENTS,
  GATORS_PRIMARY_COLORS,
  GATORS_SIZES,
  GATORS_SLUG,
  GATORS_VARIANTS,
} from "@/lib/gators";
import {
  FILAMENT_DESCRIPTION_SHORT,
  FILAMENT_IMAGES,
  FILAMENT_NAME,
  FILAMENT_PRICE_CENTS,
  FILAMENT_PRIMARY_COLORS,
  FILAMENT_SIZES,
  FILAMENT_SLUG,
  FILAMENT_VARIANTS,
} from "@/lib/filament";
import {
  LATTICE_INSOLES_DESCRIPTION_SHORT,
  LATTICE_INSOLES_IMAGES,
  LATTICE_INSOLES_NAME,
  LATTICE_INSOLES_PRICE_CENTS,
  LATTICE_INSOLES_PRIMARY_COLORS,
  LATTICE_INSOLES_SIZES,
  LATTICE_INSOLES_SLUG,
  LATTICE_INSOLES_VARIANTS,
} from "@/lib/latticeInsoles";
import {
  APPAREL_CATALOG,
  APPAREL_CATEGORY,
  OBSOLETE_APPAREL_SLUGS,
  apparelSku,
  getApparelImages,
} from "@/lib/apparel";
import { FOOTWEAR_CATALOG } from "@/lib/footwear";

/**
 * Self-heal Product.category / Product.subcategory when the apparel migration
 * has not been applied yet. Without these columns every Prisma product query
 * 500s (empty footwear grids + broken product pages).
 */
export async function ensureProductCategoryColumns(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subcategory" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Product_category_subcategory_idx" ON "Product"("category", "subcategory")`,
  );
}

const FOOTWEAR_VARIANTS: Record<
  string,
  ReadonlyArray<{ color: string; sku: string; stock: number; priceCents?: number }>
> = {
  "v3-slides": [
    { color: "black", sku: "V3-BLK", stock: 999 },
    { color: "white", sku: "V3-WHT", stock: 0 },
    { color: "grey", sku: "V3-GRY", stock: 999 },
    { color: "green", sku: "V3-GRN", stock: 0 },
    { color: "pink", sku: "V3-PNK", stock: 999 },
  ],
  dragonfly: [
    { color: "black", sku: "DF-BLK", stock: 999, priceCents: 6000 },
    { color: "white", sku: "DF-WHT", stock: 0, priceCents: 6500 },
    { color: "red", sku: "DF-RED", stock: 999, priceCents: 6500 },
    { color: "#007FFF", sku: "DF-AZR", stock: 999, priceCents: 6500 },
    { color: "pink", sku: "DF-PNK", stock: 999, priceCents: 6500 },
  ],
  "slip-ons": [
    { color: "black", sku: "SO-BLK", stock: 999 },
    { color: "grey", sku: "SO-GRY", stock: 999 },
    { color: "white", sku: "SO-WHT", stock: 0 },
    { color: "orange", sku: "SO-ORG", stock: 999 },
    { color: "pink", sku: "SO-PNK", stock: 999 },
  ],
};

const FOOTWEAR_COLORS: Record<string, string[]> = {
  "v3-slides": ["black", "white", "grey", "green", "pink"],
  dragonfly: ["black", "white", "red", "#007FFF", "pink"],
  "slip-ons": ["black", "grey", "white", "orange", "pink"],
};

const FOOTWEAR_SECONDARY: Record<string, string[]> = {
  dragonfly: [
    "black",
    "white",
    "grey",
    "red",
    "#007FFF",
    "green",
    "blue",
    "maroon",
    "pink",
    "purple",
    "orange",
    "yellow",
    "navy",
    "teal",
  ],
};

const FOOTWEAR_SIZES = ["5", "6", "7", "8", "9", "10", "11", "12"];

/** Idempotently upsert core footwear so listings/PDPs work without a manual seed. */
export async function ensureFootwearProducts(): Promise<void> {
  for (const item of FOOTWEAR_CATALOG) {
    if (item.slug === "magikid-shoes") continue; // handled by ensureMagikidShoes
    if (item.slug === GATORS_SLUG) continue; // handled by ensureGators
    if (item.slug === LATTICE_INSOLES_SLUG) continue; // handled by ensureLatticeInsoles

    const variants = FOOTWEAR_VARIANTS[item.slug] ?? [];
    const primaryColors = FOOTWEAR_COLORS[item.slug] ?? ["black"];
    const secondaryColors = FOOTWEAR_SECONDARY[item.slug] ?? [];
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });

    if (!existing) {
      await prisma.product.create({
        data: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          currency: "usd",
          category: "footwear",
          images: item.images,
          primaryColors,
          secondaryColors,
          sizes: FOOTWEAR_SIZES,
          variants: {
            create: variants.map((v) => ({
              color: v.color,
              sku: v.sku,
              stock: v.stock,
              priceCents: v.priceCents ?? null,
            })),
          },
        },
      });
      continue;
    }

    await prisma.product.update({
      where: { id: existing.id },
      data: {
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        category: "footwear",
        images: item.images,
        primaryColors,
        secondaryColors,
        sizes: FOOTWEAR_SIZES,
      },
    });

    for (const v of variants) {
      await prisma.variant.upsert({
        where: { sku: v.sku },
        update: { stock: v.stock, color: v.color, priceCents: v.priceCents ?? null },
        create: {
          product: { connect: { id: existing.id } },
          color: v.color,
          sku: v.sku,
          stock: v.stock,
          priceCents: v.priceCents ?? null,
        },
      });
    }
  }
}

const MAGIKID_SHOES_IMAGES = [
  MAGIKID_SHOES_THUMBNAIL_URL,
  "/products/slip-ons/InShot_20260405_203151152.jpg",
  "/products/slip-ons/InShot_20260405_203425292.jpg",
  "/products/slip-ons/InShot_20260405_203601045.jpg",
  "/products/slip-ons/InShot_20260405_203736918.jpg",
  "/products/slip-ons/InShot_20260405_203930832.jpg",
  "/products/slip-ons/InShot_20260405_204113872.jpg",
  "/products/slip-ons/InShot_20260405_204333303.jpg",
  "/products/slip-ons/InShot_20260405_202911983.jpg",
];

const MAGIKID_VARIANTS = [
  { color: "black", sku: "MK-BLK", stock: 999 },
  { color: "grey", sku: "MK-GRY", stock: 999 },
  { color: "white", sku: "MK-WHT", stock: 0 },
  { color: "orange", sku: "MK-ORG", stock: 0 },
  { color: "pink", sku: "MK-PNK", stock: 999 },
] as const;

const MAGIKID_PRIMARY_COLORS = ["black", "grey", "white", "orange", "pink"] as const;

/** Keep footwear white OOS / pink in stock without requiring a manual seed run. */
type FootwearStockVariant = {
  color: string;
  sku: string;
  stock: number;
  priceCents?: number;
};

const FOOTWEAR_STOCK_SYNC: Array<{
  slug: string;
  variants: FootwearStockVariant[];
}> = [
  {
    slug: "v3-slides",
    variants: [
      { color: "black", sku: "V3-BLK", stock: 999 },
      { color: "white", sku: "V3-WHT", stock: 0 },
      { color: "grey", sku: "V3-GRY", stock: 999 },
      { color: "green", sku: "V3-GRN", stock: 0 },
      { color: "pink", sku: "V3-PNK", stock: 999 },
    ],
  },
  {
    slug: "dragonfly",
    variants: [
      { color: "black", sku: "DF-BLK", stock: 999, priceCents: 6000 },
      { color: "white", sku: "DF-WHT", stock: 0, priceCents: 6500 },
      { color: "red", sku: "DF-RED", stock: 999, priceCents: 6500 },
      { color: "#007FFF", sku: "DF-AZR", stock: 999, priceCents: 6500 },
      { color: "pink", sku: "DF-PNK", stock: 999, priceCents: 6500 },
    ],
  },
  {
    slug: "slip-ons",
    variants: [
      { color: "black", sku: "SO-BLK", stock: 999 },
      { color: "grey", sku: "SO-GRY", stock: 999 },
      { color: "white", sku: "SO-WHT", stock: 0 },
      { color: "orange", sku: "SO-ORG", stock: 999 },
      { color: "pink", sku: "SO-PNK", stock: 999 },
    ],
  },
];

async function ensureFootwearStock(): Promise<void> {
  for (const product of FOOTWEAR_STOCK_SYNC) {
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (!existing) continue;

    for (const variant of product.variants) {
      await prisma.variant.upsert({
        where: { sku: variant.sku },
        update: {
          stock: variant.stock,
          ...(variant.priceCents !== undefined ? { priceCents: variant.priceCents } : {}),
        },
        create: {
          product: { connect: { id: existing.id } },
          color: variant.color,
          sku: variant.sku,
          stock: variant.stock,
          ...(variant.priceCents !== undefined ? { priceCents: variant.priceCents } : {}),
        },
      });
    }
  }
}

/** Idempotently upsert Magikid Shoes so new catalog entries appear without a manual seed run. */
export async function ensureMagikidShoes(): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { slug: "magikid-shoes" } });

  if (!existing) {
    await prisma.product.create({
      data: {
        slug: "magikid-shoes",
        name: "Magikid Shoes",
        description: MAGIKID_SHOES_DESCRIPTION_SHORT,
        priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
        currency: "usd",
        category: "footwear",
        images: MAGIKID_SHOES_IMAGES,
        primaryColors: [...MAGIKID_PRIMARY_COLORS],
        secondaryColors: [],
        sizes: MAGIKID_SHOES_KIDS_SIZES,
        variants: {
          create: MAGIKID_VARIANTS.map((v) => ({ ...v })),
        },
      },
    });
    return;
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: "Magikid Shoes",
      description: MAGIKID_SHOES_DESCRIPTION_SHORT,
      priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
      category: "footwear",
      images: MAGIKID_SHOES_IMAGES,
      primaryColors: [...MAGIKID_PRIMARY_COLORS],
      secondaryColors: [],
      sizes: MAGIKID_SHOES_KIDS_SIZES,
    },
  });

  for (const v of MAGIKID_VARIANTS) {
    await prisma.variant.upsert({
      where: { sku: v.sku },
      update: { stock: v.stock },
      create: {
        product: { connect: { id: existing.id } },
        color: v.color,
        sku: v.sku,
        stock: v.stock,
      },
    });
  }
}

/** Remove the retired Glock 43x Holster listing (and any cart rows pointing at it). */
export async function removeGunHolster(): Promise<void> {
  const existing = await prisma.product.findUnique({
    where: { slug: "gun-holster" },
    select: { id: true },
  });
  if (!existing) return;

  const variants = await prisma.variant.findMany({
    where: { productId: existing.id },
    select: { id: true },
  });
  const variantIds = variants.map((variant) => variant.id);
  if (variantIds.length > 0) {
    await prisma.cartItem.deleteMany({
      where: { variantId: { in: variantIds } },
    });
    await prisma.variant.deleteMany({
      where: { id: { in: variantIds } },
    });
  }
  await prisma.product.delete({ where: { id: existing.id } });
}

/** Idempotently upsert Antioxidant Trail Mix so it appears without a manual seed run. */
export async function ensureTrailMix(): Promise<void> {
  let existing = await prisma.product.findUnique({ where: { slug: TRAIL_MIX_SLUG } });

  if (!existing) {
    try {
      await prisma.product.create({
        data: {
          slug: TRAIL_MIX_SLUG,
          name: TRAIL_MIX_NAME,
          description: TRAIL_MIX_DESCRIPTION_SHORT,
          priceCents: TRAIL_MIX_PRICE_CENTS,
          currency: "usd",
          images: [...TRAIL_MIX_IMAGES],
          primaryColors: [...TRAIL_MIX_FLAVOR_IDS],
          secondaryColors: [],
          sizes: [...TRAIL_MIX_SIZES],
          variants: {
            create: TRAIL_MIX_VARIANTS.map((v) => ({ ...v })),
          },
        },
      });
      return;
    } catch (error) {
      // Concurrent serverless creates can race on unique slug/sku — recover and update.
      existing = await prisma.product.findUnique({ where: { slug: TRAIL_MIX_SLUG } });
      if (!existing) throw error;
    }
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: TRAIL_MIX_NAME,
      description: TRAIL_MIX_DESCRIPTION_SHORT,
      priceCents: TRAIL_MIX_PRICE_CENTS,
      images: [...TRAIL_MIX_IMAGES],
      primaryColors: [...TRAIL_MIX_FLAVOR_IDS],
      secondaryColors: [],
      sizes: [...TRAIL_MIX_SIZES],
    },
  });

  for (const v of TRAIL_MIX_VARIANTS) {
    await prisma.variant.upsert({
      where: { sku: v.sku },
      update: { stock: v.stock, color: v.color },
      create: {
        product: { connect: { id: existing.id } },
        color: v.color,
        sku: v.sku,
        stock: v.stock,
      },
    });
  }

  const keepSkus = TRAIL_MIX_VARIANTS.map((v) => v.sku);
  await prisma.variant.deleteMany({
    where: {
      productId: existing.id,
      sku: { notIn: [...keepSkus] },
    },
  });
}

/** Idempotently upsert Violette Ponybead Animals so Collaborative shows it without a manual seed. */
export async function ensureViolettePonybeadAnimals(): Promise<void> {
  let existing = await prisma.product.findUnique({ where: { slug: VIOLETTE_PONYBEAD_SLUG } });

  if (!existing) {
    try {
      await prisma.product.create({
        data: {
          slug: VIOLETTE_PONYBEAD_SLUG,
          name: VIOLETTE_PONYBEAD_NAME,
          description: VIOLETTE_PONYBEAD_DESCRIPTION_SHORT,
          priceCents: VIOLETTE_PONYBEAD_PRICE_CENTS,
          currency: "usd",
          images: [...VIOLETTE_PONYBEAD_IMAGES],
          primaryColors: [...VIOLETTE_PONYBEAD_ANIMAL_IDS],
          secondaryColors: [],
          sizes: [...VIOLETTE_PONYBEAD_SIZES],
          variants: {
            create: VIOLETTE_PONYBEAD_VARIANTS.map((v) => ({ ...v })),
          },
        },
      });
      return;
    } catch (error) {
      existing = await prisma.product.findUnique({ where: { slug: VIOLETTE_PONYBEAD_SLUG } });
      if (!existing) throw error;
    }
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: VIOLETTE_PONYBEAD_NAME,
      description: VIOLETTE_PONYBEAD_DESCRIPTION_SHORT,
      priceCents: VIOLETTE_PONYBEAD_PRICE_CENTS,
      images: [...VIOLETTE_PONYBEAD_IMAGES],
      primaryColors: [...VIOLETTE_PONYBEAD_ANIMAL_IDS],
      secondaryColors: [],
      sizes: [...VIOLETTE_PONYBEAD_SIZES],
    },
  });

  for (const v of VIOLETTE_PONYBEAD_VARIANTS) {
    await prisma.variant.upsert({
      where: { sku: v.sku },
      update: { stock: v.stock, color: v.color },
      create: {
        product: { connect: { id: existing.id } },
        color: v.color,
        sku: v.sku,
        stock: v.stock,
      },
    });
  }

  const keepSkus = VIOLETTE_PONYBEAD_VARIANTS.map((v) => v.sku);
  await prisma.variant.deleteMany({
    where: {
      productId: existing.id,
      sku: { notIn: [...keepSkus] },
    },
  });
}

/** Idempotently upsert The Gators so the listing appears without a manual seed run. */
export async function ensureGators(): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { slug: GATORS_SLUG } });

  if (!existing) {
    await prisma.product.create({
      data: {
        slug: GATORS_SLUG,
        name: GATORS_NAME,
        description: GATORS_DESCRIPTION_SHORT,
        priceCents: GATORS_PRICE_CENTS,
        currency: "usd",
        images: [...GATORS_IMAGES],
        primaryColors: [...GATORS_PRIMARY_COLORS],
        secondaryColors: [],
        sizes: [...GATORS_SIZES],
        variants: {
          create: GATORS_VARIANTS.map((v) => ({ ...v })),
        },
      },
    });
    return;
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: GATORS_NAME,
      description: GATORS_DESCRIPTION_SHORT,
      priceCents: GATORS_PRICE_CENTS,
      images: [...GATORS_IMAGES],
      primaryColors: [...GATORS_PRIMARY_COLORS],
      secondaryColors: [],
      sizes: [...GATORS_SIZES],
    },
  });

  for (const v of GATORS_VARIANTS) {
    await prisma.variant.upsert({
      where: { sku: v.sku },
      update: { stock: v.stock, color: v.color },
      create: {
        product: { connect: { id: existing.id } },
        color: v.color,
        sku: v.sku,
        stock: v.stock,
      },
    });
  }

  const keepSkus = GATORS_VARIANTS.map((v) => v.sku);
  await prisma.variant.deleteMany({
    where: {
      productId: existing.id,
      sku: { notIn: [...keepSkus] },
    },
  });
}

/** Idempotently upsert TPU-90A Filament so the Engineering listing appears without a manual seed. */
export async function ensureFilament(): Promise<void> {
  let existing = await prisma.product.findUnique({ where: { slug: FILAMENT_SLUG } });

  if (!existing) {
    try {
      await prisma.product.create({
        data: {
          slug: FILAMENT_SLUG,
          name: FILAMENT_NAME,
          description: FILAMENT_DESCRIPTION_SHORT,
          priceCents: FILAMENT_PRICE_CENTS,
          currency: "usd",
          images: [...FILAMENT_IMAGES],
          primaryColors: [...FILAMENT_PRIMARY_COLORS],
          secondaryColors: [],
          sizes: [...FILAMENT_SIZES],
          variants: {
            create: FILAMENT_VARIANTS.map((v) => ({ ...v })),
          },
        },
      });
      return;
    } catch (error) {
      existing = await prisma.product.findUnique({ where: { slug: FILAMENT_SLUG } });
      if (!existing) throw error;
    }
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: FILAMENT_NAME,
      description: FILAMENT_DESCRIPTION_SHORT,
      priceCents: FILAMENT_PRICE_CENTS,
      images: [...FILAMENT_IMAGES],
      primaryColors: [...FILAMENT_PRIMARY_COLORS],
      secondaryColors: [],
      sizes: [...FILAMENT_SIZES],
    },
  });

  for (const v of FILAMENT_VARIANTS) {
    await prisma.variant.upsert({
      where: { sku: v.sku },
      update: { stock: v.stock, color: v.color },
      create: {
        product: { connect: { id: existing.id } },
        color: v.color,
        sku: v.sku,
        stock: v.stock,
      },
    });
  }

  const keepSkus = FILAMENT_VARIANTS.map((v) => v.sku);
  await prisma.variant.deleteMany({
    where: {
      productId: existing.id,
      sku: { notIn: [...keepSkus] },
    },
  });
}

/**
 * Sync Lattice Insoles variants by color (not SKU-only upsert).
 *
 * Legacy apparel rows used APP-INSL-* SKUs with stock 0. Creating INSL-* via
 * sku upsert fails on @@unique([productId, color]), so Add to Cart stayed
 * disabled. Reuse the color row, rename the SKU, and restock instead.
 */
async function syncLatticeInsoleVariants(productId: string): Promise<void> {
  const existingVariants = await prisma.variant.findMany({
    where: { productId },
    select: { id: true, sku: true, color: true },
  });
  const bySku = new Map(existingVariants.map((variant) => [variant.sku, variant]));
  const byColor = new Map(existingVariants.map((variant) => [variant.color, variant]));
  const keepIds = new Set<string>();

  for (const desired of LATTICE_INSOLES_VARIANTS) {
    const match = bySku.get(desired.sku) ?? byColor.get(desired.color);
    if (match) {
      await prisma.variant.update({
        where: { id: match.id },
        data: {
          sku: desired.sku,
          color: desired.color,
          stock: desired.stock,
        },
      });
      keepIds.add(match.id);
      continue;
    }

    const created = await prisma.variant.create({
      data: {
        productId,
        color: desired.color,
        sku: desired.sku,
        stock: desired.stock,
      },
    });
    keepIds.add(created.id);
  }

  const obsoleteIds = existingVariants
    .filter((variant) => !keepIds.has(variant.id))
    .map((variant) => variant.id);
  if (obsoleteIds.length > 0) {
    await prisma.cartItem.deleteMany({
      where: { variantId: { in: obsoleteIds } },
    });
    await prisma.variant.deleteMany({
      where: { id: { in: obsoleteIds } },
    });
  }
}

/** Idempotently upsert Lattice Insoles on All Footwear (S–XL, not shoe sizes). */
export async function ensureLatticeInsoles(): Promise<void> {
  let existing = await prisma.product.findUnique({ where: { slug: LATTICE_INSOLES_SLUG } });

  if (!existing) {
    try {
      await prisma.product.create({
        data: {
          slug: LATTICE_INSOLES_SLUG,
          name: LATTICE_INSOLES_NAME,
          description: LATTICE_INSOLES_DESCRIPTION_SHORT,
          priceCents: LATTICE_INSOLES_PRICE_CENTS,
          currency: "usd",
          category: "footwear",
          subcategory: null,
          images: [...LATTICE_INSOLES_IMAGES],
          primaryColors: [...LATTICE_INSOLES_PRIMARY_COLORS],
          secondaryColors: [],
          sizes: [...LATTICE_INSOLES_SIZES],
          variants: {
            create: LATTICE_INSOLES_VARIANTS.map((v) => ({ ...v })),
          },
        },
      });
      return;
    } catch (error) {
      existing = await prisma.product.findUnique({ where: { slug: LATTICE_INSOLES_SLUG } });
      if (!existing) throw error;
    }
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: LATTICE_INSOLES_NAME,
      description: LATTICE_INSOLES_DESCRIPTION_SHORT,
      priceCents: LATTICE_INSOLES_PRICE_CENTS,
      category: "footwear",
      subcategory: null,
      images: [...LATTICE_INSOLES_IMAGES],
      primaryColors: [...LATTICE_INSOLES_PRIMARY_COLORS],
      secondaryColors: [],
      sizes: [...LATTICE_INSOLES_SIZES],
    },
  });

  await syncLatticeInsoleVariants(existing.id);
}

/** Drop removed apparel products (and their variants/cart rows) from the DB. */
export async function purgeObsoleteApparelProducts(): Promise<void> {
  const obsoleteSlugs = [...OBSOLETE_APPAREL_SLUGS];
  if (obsoleteSlugs.length === 0) return;

  const obsolete = await prisma.product.findMany({
    where: { slug: { in: obsoleteSlugs } },
    select: { id: true },
  });
  const obsoleteIds = obsolete.map((product) => product.id);
  if (obsoleteIds.length === 0) return;

  const variants = await prisma.variant.findMany({
    where: { productId: { in: obsoleteIds } },
    select: { id: true },
  });
  const variantIds = variants.map((variant) => variant.id);
  if (variantIds.length > 0) {
    await prisma.cartItem.deleteMany({
      where: { variantId: { in: variantIds } },
    });
    await prisma.variant.deleteMany({
      where: { id: { in: variantIds } },
    });
  }
  await prisma.product.deleteMany({
    where: { id: { in: obsoleteIds } },
  });
}

/** Remove the retired RC Car Stickers listing (and cart rows) so it cannot resurface. */
export async function removeRcCarStickers(): Promise<void> {
  const existing = await prisma.product.findUnique({
    where: { slug: "voronyz-rc-car-stickers" },
    select: { id: true },
  });
  if (!existing) return;

  const variants = await prisma.variant.findMany({
    where: { productId: existing.id },
    select: { id: true },
  });
  const variantIds = variants.map((variant) => variant.id);
  if (variantIds.length > 0) {
    await prisma.cartItem.deleteMany({
      where: { variantId: { in: variantIds } },
    });
    await prisma.variant.deleteMany({
      where: { id: { in: variantIds } },
    });
  }
  await prisma.product.delete({ where: { id: existing.id } });
}

/** Idempotently upsert apparel catalog products (live stock or coming-soon stock 0). */
export async function ensureApparelProducts(): Promise<void> {
  await purgeObsoleteApparelProducts();

  for (const item of APPAREL_CATALOG) {
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });
    const variants = item.colors.map((color) => ({
      color,
      sku: apparelSku(item.skuPrefix, color),
      // Live listings are buyable now; coming-soon stays at 0 (pre-order path).
      stock: item.comingSoon ? 0 : 999,
    }));

    if (!existing) {
      await prisma.product.create({
        data: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          currency: "usd",
          category: APPAREL_CATEGORY,
          subcategory: item.subcategory,
          images: getApparelImages(item),
          primaryColors: [...item.colors],
          secondaryColors: [],
          sizes: [...item.sizes],
          variants: {
            create: variants,
          },
        },
      });
      continue;
    }

    await prisma.product.update({
      where: { id: existing.id },
      data: {
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        category: APPAREL_CATEGORY,
        subcategory: item.subcategory,
        images: getApparelImages(item),
        primaryColors: [...item.colors],
        secondaryColors: [],
        sizes: [...item.sizes],
      },
    });

    for (const variant of variants) {
      await prisma.variant.upsert({
        where: { sku: variant.sku },
        update: { stock: variant.stock, color: variant.color },
        create: {
          product: { connect: { id: existing.id } },
          color: variant.color,
          sku: variant.sku,
          stock: variant.stock,
        },
      });
    }

    const keepSkus = variants.map((variant) => variant.sku);
    await prisma.variant.deleteMany({
      where: {
        productId: existing.id,
        sku: { notIn: keepSkus },
      },
    });
  }
}

/** Skip repeat catalog upserts within this TTL (hot path: /api/search). */
const ENSURE_TTL_MS = 5 * 60 * 1000;

let lastEnsureAt = 0;
let ensureInFlight: Promise<void> | null = null;

/**
 * Idempotently sync catalog products. Cached + deduped so listing pages
 * (All Footwear) are not blocked by heavy apparel upserts on every request.
 */
export async function ensureCatalogProducts(): Promise<void> {
  const now = Date.now();
  if (ensureInFlight) return ensureInFlight;
  if (now - lastEnsureAt < ENSURE_TTL_MS) return;

  ensureInFlight = (async () => {
    try {
      // Schema heal must not be swallowed — without these columns every product query 500s.
      await ensureProductCategoryColumns();
      // Isolate failures so apparel/stock errors cannot skip Trail Mix / filament sync.
      const results = await Promise.allSettled([
        ensureFootwearProducts(),
        ensureFootwearStock(),
        ensureMagikidShoes(),
        ensureGators(),
        ensureLatticeInsoles(),
        removeGunHolster(),
        removeRcCarStickers(),
        ensureFilament(),
        ensureTrailMix(),
        ensureViolettePonybeadAnimals(),
        ensureApparelProducts(),
      ]);
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("ensureCatalogProducts task failed:", result.reason);
        }
      }
      // Advance TTL after an attempt — Collaborative also has ensureHealthCatalog.
      lastEnsureAt = Date.now();
    } catch (error) {
      console.error("ensureCatalogProducts failed:", error);
    } finally {
      ensureInFlight = null;
    }
  })();

  return ensureInFlight;
}

/** Footwear-only ensure — skips apparel/accessories for fast All Footwear loads. */
let footwearEnsureAt = 0;
let footwearEnsureInFlight: Promise<void> | null = null;
const FOOTWEAR_ENSURE_TTL_MS = 10 * 60 * 1000;

export async function ensureFootwearCatalog(): Promise<void> {
  const now = Date.now();
  if (footwearEnsureInFlight) return footwearEnsureInFlight;
  if (now - footwearEnsureAt < FOOTWEAR_ENSURE_TTL_MS) return;

  footwearEnsureInFlight = (async () => {
    try {
      await ensureProductCategoryColumns();
      // Delete RC Car Stickers (and other obsolete apparel leftovers) on every
      // footwear catalog refresh so they cannot leak into All Footwear.
      await removeRcCarStickers();
      await purgeObsoleteApparelProducts();
      await ensureFootwearProducts();
      await ensureFootwearStock();
      await ensureGators();
      await ensureLatticeInsoles();
      await ensureMagikidShoes();
      footwearEnsureAt = Date.now();
    } catch (error) {
      console.error("ensureFootwearCatalog failed:", error);
    } finally {
      footwearEnsureInFlight = null;
    }
  })();

  return footwearEnsureInFlight;
}

/** Collaborative-only ensure — skips apparel/footwear for fast /health loads. */
let healthEnsureAt = 0;
let healthEnsureInFlight: Promise<void> | null = null;
const HEALTH_ENSURE_TTL_MS = 10 * 60 * 1000;

export async function ensureHealthCatalog(): Promise<void> {
  const now = Date.now();
  if (healthEnsureInFlight) return healthEnsureInFlight;
  if (now - healthEnsureAt < HEALTH_ENSURE_TTL_MS) return;

  healthEnsureInFlight = (async () => {
    try {
      await ensureProductCategoryColumns();
      await ensureViolettePonybeadAnimals();
      await ensureTrailMix();
      healthEnsureAt = Date.now();
    } catch (error) {
      console.error("ensureHealthCatalog failed:", error);
    } finally {
      healthEnsureInFlight = null;
    }
  })();

  return healthEnsureInFlight;
}

/** Engineering-only ensure — skips apparel/footwear for fast /accessories loads. */
let accessoriesEnsureAt = 0;
let accessoriesEnsureInFlight: Promise<void> | null = null;
const ACCESSORIES_ENSURE_TTL_MS = 10 * 60 * 1000;

export async function ensureAccessoriesCatalog(): Promise<void> {
  const now = Date.now();
  if (accessoriesEnsureInFlight) return accessoriesEnsureInFlight;
  if (now - accessoriesEnsureAt < ACCESSORIES_ENSURE_TTL_MS) return;

  accessoriesEnsureInFlight = (async () => {
    try {
      await ensureProductCategoryColumns();
      await removeGunHolster();
      await ensureFilament();
      accessoriesEnsureAt = Date.now();
    } catch (error) {
      console.error("ensureAccessoriesCatalog failed:", error);
    } finally {
      accessoriesEnsureInFlight = null;
    }
  })();

  return accessoriesEnsureInFlight;
}
