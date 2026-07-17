import { prisma } from "@/lib/prisma";
import { MAGIKID_SHOES_THUMBNAIL_URL, MAGIKID_SHOES_KIDS_SIZES, MAGIKID_SHOES_DESCRIPTION_SHORT, MAGIKID_SHOES_BASE_PRICE_CENTS } from "@/lib/magikidShoesThumbnail";
import {
  GUN_HOLSTER_DESCRIPTION_SHORT,
  GUN_HOLSTER_IMAGES,
  GUN_HOLSTER_NAME,
  GUN_HOLSTER_PRICE_CENTS,
  GUN_HOLSTER_PRIMARY_COLORS,
  GUN_HOLSTER_SIZES,
  GUN_HOLSTER_SLUG,
  GUN_HOLSTER_VARIANTS,
} from "@/lib/gunHolster";
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
  APPAREL_CATALOG,
  apparelSku,
} from "@/lib/apparel";

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
] as const;

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
        images: MAGIKID_SHOES_IMAGES,
        primaryColors: ["black", "grey", "white", "orange"],
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
      images: MAGIKID_SHOES_IMAGES,
      primaryColors: ["black", "grey", "white", "orange"],
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

/** Idempotently upsert Gun Holster so it appears without a manual seed run. */
export async function ensureGunHolster(): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { slug: GUN_HOLSTER_SLUG } });

  if (!existing) {
    await prisma.product.create({
      data: {
        slug: GUN_HOLSTER_SLUG,
        name: GUN_HOLSTER_NAME,
        description: GUN_HOLSTER_DESCRIPTION_SHORT,
        priceCents: GUN_HOLSTER_PRICE_CENTS,
        currency: "usd",
        images: [...GUN_HOLSTER_IMAGES],
        primaryColors: [...GUN_HOLSTER_PRIMARY_COLORS],
        secondaryColors: [],
        sizes: [...GUN_HOLSTER_SIZES],
        variants: {
          create: GUN_HOLSTER_VARIANTS.map((v) => ({ ...v })),
        },
      },
    });
    return;
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: GUN_HOLSTER_NAME,
      description: GUN_HOLSTER_DESCRIPTION_SHORT,
      priceCents: GUN_HOLSTER_PRICE_CENTS,
      images: [...GUN_HOLSTER_IMAGES],
      primaryColors: [...GUN_HOLSTER_PRIMARY_COLORS],
      secondaryColors: [],
      sizes: [...GUN_HOLSTER_SIZES],
    },
  });

  for (const v of GUN_HOLSTER_VARIANTS) {
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

  const keepSkus = GUN_HOLSTER_VARIANTS.map((v) => v.sku);
  await prisma.variant.deleteMany({
    where: {
      productId: existing.id,
      sku: { notIn: [...keepSkus] },
    },
  });
}

/** Idempotently upsert Antioxidant Trail Mix so it appears without a manual seed run. */
export async function ensureTrailMix(): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { slug: TRAIL_MIX_SLUG } });

  if (!existing) {
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

/** Idempotently upsert apparel catalog products. */
export async function ensureApparelProducts(): Promise<void> {
  for (const item of APPAREL_CATALOG) {
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });
    const variants = item.colors.map((color) => ({
      color,
      sku: apparelSku(item.skuPrefix, color),
      stock: 999,
    }));

    if (!existing) {
      await prisma.product.create({
        data: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          currency: "usd",
          images: [item.image],
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
        images: [item.image],
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

export async function ensureCatalogProducts(): Promise<void> {
  try {
    await ensureMagikidShoes();
    await ensureGunHolster();
    await ensureTrailMix();
    await ensureApparelProducts();
  } catch (error) {
    console.error("ensureCatalogProducts failed:", error);
  }
}
