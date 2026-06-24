import { prisma } from "@/lib/prisma";
import { MAGIKID_SHOES_THUMBNAIL_URL } from "@/lib/magikidShoesThumbnail";

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
        description:
          "Custom 3D-printed slip-ons with a flexible lattice sole and Magikid star charm. Pick black or grey — $37 with shipping, or save with in-person pickup at Magikid Lab.",
        priceCents: 3700,
        currency: "usd",
        images: MAGIKID_SHOES_IMAGES,
        primaryColors: ["black", "grey", "white", "orange"],
        secondaryColors: [],
        sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
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
      description:
        "Custom 3D-printed slip-ons with a flexible lattice sole and Magikid star charm. Pick black or grey — $37 with shipping, or save with in-person pickup at Magikid Lab.",
      priceCents: 3700,
      images: MAGIKID_SHOES_IMAGES,
      primaryColors: ["black", "grey", "white", "orange"],
      secondaryColors: [],
      sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
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

export async function ensureCatalogProducts(): Promise<void> {
  try {
    await ensureMagikidShoes();
  } catch (error) {
    console.error("ensureCatalogProducts failed:", error);
  }
}
