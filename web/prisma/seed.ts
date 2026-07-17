import { PrismaClient } from "@prisma/client";
import { MAGIKID_SHOES_THUMBNAIL_URL, MAGIKID_SHOES_KIDS_SIZES, MAGIKID_SHOES_DESCRIPTION_SHORT, MAGIKID_SHOES_BASE_PRICE_CENTS } from "../src/lib/magikidShoesThumbnail";
import {
  GUN_HOLSTER_DESCRIPTION_SHORT,
  GUN_HOLSTER_IMAGES,
  GUN_HOLSTER_NAME,
  GUN_HOLSTER_PRICE_CENTS,
  GUN_HOLSTER_PRIMARY_COLORS,
  GUN_HOLSTER_SIZES,
  GUN_HOLSTER_SLUG,
  GUN_HOLSTER_VARIANTS,
} from "../src/lib/gunHolster";
import {
  TRAIL_MIX_DESCRIPTION_SHORT,
  TRAIL_MIX_FLAVOR_IDS,
  TRAIL_MIX_IMAGES,
  TRAIL_MIX_NAME,
  TRAIL_MIX_PRICE_CENTS,
  TRAIL_MIX_SIZES,
  TRAIL_MIX_SLUG,
  TRAIL_MIX_VARIANTS,
} from "../src/lib/trailMix";
import {
  GATORS_DESCRIPTION_SHORT,
  GATORS_IMAGES,
  GATORS_NAME,
  GATORS_PRICE_CENTS,
  GATORS_PRIMARY_COLORS,
  GATORS_SIZES,
  GATORS_SLUG,
  GATORS_VARIANTS,
} from "../src/lib/gators";

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed script...');
  try {
    const existing = await prisma.product.findUnique({ where: { slug: "v3-slides" } });
    console.log('Existing product check:', existing ? 'Found' : 'Not found');
    if (!existing) {
      console.log('Creating new product...');
      const product = await prisma.product.create({
        data: {
          slug: "v3-slides",
          name: "V3 Slides",
          description:
            "World-class FDM printed slides with TPU lattice lowers and breathable uppers. Engineered from precision 3D scans.",
          priceCents: 5500,
          currency: "usd",
          images: [
            "/products/v3-slides/InShot_20260212_194352014.jpg",
            "/products/v3-slides/InShot_20260212_193956953.jpg",
            "/products/v3-slides/InShot_20260212_194215252.jpg",
            "/products/v3-slides/InShot_20260212_194654595.jpg",
            "/products/v3-slides/InShot_20260212_194922422.jpg",
            "/products/v3-slides/InShot_20260212_195048118.jpg",
            "/products/v3-slides/InShot_20260212_195217163.jpg",
            "/products/v3-slides/InShot_20260212_195358936.jpg",
            "/products/v3-slides/InShot_20260212_195535113.jpg",
            "/products/v3-slides/InShot_20260212_195649672.jpg",
          ],
          primaryColors: ["black", "white", "grey", "green", "pink"],
          secondaryColors: [],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
          variants: {
            create: [
              { color: "black", sku: "V3-BLK", stock: 999 },
              { color: "white", sku: "V3-WHT", stock: 0 },  // Out of stock
              { color: "grey", sku: "V3-GRY", stock: 999 },
              { color: "green", sku: "V3-GRN", stock: 0 },  // Out of stock
              { color: "pink", sku: "V3-PNK", stock: 999 },
            ],
          },
        },
        include: { variants: true },
      });
      console.log("Seeded product:", product.slug);
    } else {
      console.log('Updating existing product...');
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          priceCents: 5500,
          images: [
            "/products/v3-slides/InShot_20260212_194352014.jpg",
            "/products/v3-slides/InShot_20260212_193956953.jpg",
            "/products/v3-slides/InShot_20260212_194215252.jpg",
            "/products/v3-slides/InShot_20260212_194654595.jpg",
            "/products/v3-slides/InShot_20260212_194922422.jpg",
            "/products/v3-slides/InShot_20260212_195048118.jpg",
            "/products/v3-slides/InShot_20260212_195217163.jpg",
            "/products/v3-slides/InShot_20260212_195358936.jpg",
            "/products/v3-slides/InShot_20260212_195535113.jpg",
            "/products/v3-slides/InShot_20260212_195649672.jpg",
          ],
          primaryColors: ["black", "white", "grey", "green", "pink"],
          secondaryColors: [],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
        },
      });
      console.log('Product arrays updated.');

      // Upsert variants for each primary color
      const primaryColors = ["black", "white", "grey", "green", "pink"];
      const stockMap = {
        black: 999,
        white: 0,
        grey: 999,
        green: 0,
        pink: 999,
      };

      const skuMap: Record<string, string> = {
        black: "V3-BLK",
        white: "V3-WHT",
        grey: "V3-GRY",
        green: "V3-GRN",
        pink: "V3-PNK",
      };

      console.log('Starting variant upserts...');
      for (const color of primaryColors) {
        const sku = skuMap[color] || `V3-${color.toUpperCase().slice(0,3)}`;
        console.log(`Upserting variant for ${color} (SKU: ${sku})`);
        await prisma.variant.upsert({
          where: { sku },
          update: { stock: stockMap[color as keyof typeof stockMap] },
          create: {
            product: { connect: { id: existing.id } },
            color,
            sku,
            stock: stockMap[color as keyof typeof stockMap],
          },
        });
      }
      console.log("All variants updated.");
      console.log("Updated product and variants for: v3-slides");
    }
    // ── Dragonfly product ──
    const existingDf = await prisma.product.findUnique({ where: { slug: "dragonfly" } });
    console.log('Dragonfly product check:', existingDf ? 'Found' : 'Not found');
    if (!existingDf) {
      console.log('Creating Dragonfly product...');
      const dfProduct = await prisma.product.create({
        data: {
          slug: "dragonfly",
          name: "The Dragonfly's",
          description:
            "Lightweight, breathable 3D-printed sneakers with a custom lattice sole and interchangeable laces. Engineered for all-day comfort.",
          priceCents: 6500,
          currency: "usd",
          images: [
            "/products/dragonfly/InShot_20260212_153516456.jpg",
            "/products/dragonfly/InShot_20260212_153903491.jpg",
            "/products/dragonfly/InShot_20260212_154319265.jpg",
            "/products/dragonfly/InShot_20260212_154545771.jpg",
            "/products/dragonfly/InShot_20260212_154719489.jpg",
            "/products/dragonfly/InShot_20260212_154956597.jpg",
            "/products/dragonfly/InShot_20260212_155434004.jpg",
            "/products/dragonfly/InShot_20260212_155809942.jpg",
            "/products/dragonfly/InShot_20260212_160512335.jpg",
          ],
          primaryColors: ["black", "white", "red", "#007FFF"],
          secondaryColors: ["black", "white", "grey", "red", "#007FFF", "green", "blue", "maroon", "pink", "purple", "orange", "yellow", "navy", "teal"],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
          variants: {
            create: [
              { color: "black", sku: "DF-BLK", stock: 999, priceCents: 6000 },
              { color: "white", sku: "DF-WHT", stock: 0, priceCents: 6500 },  // Out of stock
              { color: "red", sku: "DF-RED", stock: 999, priceCents: 6500 },
              { color: "#007FFF", sku: "DF-AZR", stock: 999, priceCents: 6500 },
            ],
          },
        },
        include: { variants: true },
      });
      console.log("Seeded product:", dfProduct.slug);
    } else {
      console.log('Updating existing Dragonfly product...');
      await prisma.product.update({
        where: { id: existingDf.id },
        data: {
          name: "The Dragonfly's",
          description:
            "Lightweight, breathable 3D-printed sneakers with a custom lattice sole and interchangeable laces. Engineered for all-day comfort.",
          priceCents: 6500,
          images: [
            "/products/dragonfly/InShot_20260212_153516456.jpg",
            "/products/dragonfly/InShot_20260212_153903491.jpg",
            "/products/dragonfly/InShot_20260212_154319265.jpg",
            "/products/dragonfly/InShot_20260212_154545771.jpg",
            "/products/dragonfly/InShot_20260212_154719489.jpg",
            "/products/dragonfly/InShot_20260212_154956597.jpg",
            "/products/dragonfly/InShot_20260212_155434004.jpg",
            "/products/dragonfly/InShot_20260212_155809942.jpg",
            "/products/dragonfly/InShot_20260212_160512335.jpg",
          ],
          primaryColors: ["black", "white", "red", "#007FFF"],
          secondaryColors: ["black", "white", "grey", "red", "#007FFF", "green", "blue", "maroon", "pink", "purple", "orange", "yellow", "navy", "teal"],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
        },
      });

      // Upsert Dragonfly variants
      const dfVariants = [
        { color: "black", sku: "DF-BLK", stock: 999, priceCents: 6000 },
        { color: "white", sku: "DF-WHT", stock: 0, priceCents: 6500 },
        { color: "red", sku: "DF-RED", stock: 999, priceCents: 6500 },
        { color: "#007FFF", sku: "DF-AZR", stock: 999, priceCents: 6500 },
      ];
      for (const v of dfVariants) {
        await prisma.variant.upsert({
          where: { sku: v.sku },
          update: { stock: v.stock, priceCents: v.priceCents },
          create: {
            product: { connect: { id: existingDf.id } },
            color: v.color,
            sku: v.sku,
            stock: v.stock,
            priceCents: v.priceCents,
          },
        });
      }
      console.log("Updated Dragonfly product and variants.");
    }

    // ── Slip Ons ──
    /* Former 2nd image rotated to end; others shift forward (thumbnail unchanged). */
    const slipOnImages = [
      "/products/slip-ons/InShot_20260405_203151152.jpg",
      "/products/slip-ons/InShot_20260405_203425292.jpg",
      "/products/slip-ons/InShot_20260405_203601045.jpg",
      "/products/slip-ons/InShot_20260405_203736918.jpg",
      "/products/slip-ons/InShot_20260405_203930832.jpg",
      "/products/slip-ons/InShot_20260405_204113872.jpg",
      "/products/slip-ons/InShot_20260405_204333303.jpg",
      "/products/slip-ons/InShot_20260405_202911983.jpg",
    ];
    const existingSo = await prisma.product.findUnique({ where: { slug: "slip-ons" } });
    console.log("Slip Ons product check:", existingSo ? "Found" : "Not found");
    if (!existingSo) {
      const soProduct = await prisma.product.create({
        data: {
          slug: "slip-ons",
          name: "Slip Ons",
          description:
            "Minimal 3D-printed slip-ons with a flexible lattice sole and a clean, easy-on silhouette. One body color per pair — pick black, grey, or orange (white coming soon).",
          priceCents: 6000,
          currency: "usd",
          images: slipOnImages,
          primaryColors: ["black", "grey", "white", "orange"],
          secondaryColors: [],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
          variants: {
            create: [
              { color: "black", sku: "SO-BLK", stock: 999 },
              { color: "grey", sku: "SO-GRY", stock: 999 },
              { color: "white", sku: "SO-WHT", stock: 0 },
              { color: "orange", sku: "SO-ORG", stock: 999 },
            ],
          },
        },
        include: { variants: true },
      });
      console.log("Seeded product:", soProduct.slug);
    } else {
      console.log("Updating existing Slip Ons product...");
      await prisma.product.update({
        where: { id: existingSo.id },
        data: {
          name: "Slip Ons",
          description:
            "Minimal 3D-printed slip-ons with a flexible lattice sole and a clean, easy-on silhouette. One body color per pair — pick black, grey, or orange (white coming soon).",
          priceCents: 6000,
          images: slipOnImages,
          primaryColors: ["black", "grey", "white", "orange"],
          secondaryColors: [],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
        },
      });
      const soVariants = [
        { color: "black", sku: "SO-BLK", stock: 999 },
        { color: "grey", sku: "SO-GRY", stock: 999 },
        { color: "white", sku: "SO-WHT", stock: 0 },
        { color: "orange", sku: "SO-ORG", stock: 999 },
      ];
      for (const v of soVariants) {
        await prisma.variant.upsert({
          where: { sku: v.sku },
          update: { stock: v.stock },
          create: {
            product: { connect: { id: existingSo.id } },
            color: v.color,
            sku: v.sku,
            stock: v.stock,
          },
        });
      }
      console.log("Updated Slip Ons product and variants.");
    }

    // ── Magikid Shoes ──
    const magikidShoesImages = [
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
    const existingMk = await prisma.product.findUnique({ where: { slug: "magikid-shoes" } });
    console.log("Magikid Shoes product check:", existingMk ? "Found" : "Not found");
    if (!existingMk) {
      const mkProduct = await prisma.product.create({
        data: {
          slug: "magikid-shoes",
          name: "Magikid Shoes",
          description: MAGIKID_SHOES_DESCRIPTION_SHORT,
          priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
          currency: "usd",
          images: magikidShoesImages,
          primaryColors: ["black", "grey", "white", "orange"],
          secondaryColors: [],
          sizes: MAGIKID_SHOES_KIDS_SIZES,
          variants: {
            create: [
              { color: "black", sku: "MK-BLK", stock: 999 },
              { color: "grey", sku: "MK-GRY", stock: 999 },
              { color: "white", sku: "MK-WHT", stock: 0 },
              { color: "orange", sku: "MK-ORG", stock: 0 },
            ],
          },
        },
        include: { variants: true },
      });
      console.log("Seeded product:", mkProduct.slug);
    } else {
      console.log("Updating existing Magikid Shoes product...");
      await prisma.product.update({
        where: { id: existingMk.id },
        data: {
          name: "Magikid Shoes",
          description: MAGIKID_SHOES_DESCRIPTION_SHORT,
          priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
          images: magikidShoesImages,
          primaryColors: ["black", "grey", "white", "orange"],
          secondaryColors: [],
          sizes: MAGIKID_SHOES_KIDS_SIZES,
        },
      });
      const mkVariants = [
        { color: "black", sku: "MK-BLK", stock: 999 },
        { color: "grey", sku: "MK-GRY", stock: 999 },
        { color: "white", sku: "MK-WHT", stock: 0 },
        { color: "orange", sku: "MK-ORG", stock: 0 },
      ];
      for (const v of mkVariants) {
        await prisma.variant.upsert({
          where: { sku: v.sku },
          update: { stock: v.stock },
          create: {
            product: { connect: { id: existingMk.id } },
            color: v.color,
            sku: v.sku,
            stock: v.stock,
          },
        });
      }
      console.log("Updated Magikid Shoes product and variants.");
    }

    // ── Glock 43x Holster (Voronyz Engineering — not footwear) ──
    const existingGh = await prisma.product.findUnique({ where: { slug: GUN_HOLSTER_SLUG } });
    console.log("Glock 43x Holster product check:", existingGh ? "Found" : "Not found");
    if (!existingGh) {
      const ghProduct = await prisma.product.create({
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
        include: { variants: true },
      });
      console.log("Seeded product:", ghProduct.slug);
    } else {
      console.log("Updating existing Glock 43x Holster product...");
      await prisma.product.update({
        where: { id: existingGh.id },
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
            product: { connect: { id: existingGh.id } },
            color: v.color,
            sku: v.sku,
            stock: v.stock,
          },
        });
      }
      const keepSkus = GUN_HOLSTER_VARIANTS.map((v) => v.sku);
      await prisma.variant.deleteMany({
        where: {
          productId: existingGh.id,
          sku: { notIn: [...keepSkus] },
        },
      });
      console.log("Updated Gun Holster product and variants.");
    }

    // ── Antioxidant Trail Mix (Voronyz Health — not footwear) ──
    const existingTrail = await prisma.product.findUnique({ where: { slug: TRAIL_MIX_SLUG } });
    console.log("Antioxidant Trail Mix product check:", existingTrail ? "Found" : "Not found");
    if (!existingTrail) {
      const trailProduct = await prisma.product.create({
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
        include: { variants: true },
      });
      console.log("Seeded product:", trailProduct.slug);
    } else {
      console.log("Updating existing Antioxidant Trail Mix product...");
      await prisma.product.update({
        where: { id: existingTrail.id },
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
            product: { connect: { id: existingTrail.id } },
            color: v.color,
            sku: v.sku,
            stock: v.stock,
          },
        });
      }
      const keepTrailSkus = TRAIL_MIX_VARIANTS.map((v) => v.sku);
      await prisma.variant.deleteMany({
        where: {
          productId: existingTrail.id,
          sku: { notIn: [...keepTrailSkus] },
        },
      });
      console.log("Updated Antioxidant Trail Mix product and variants.");
    }

    // ── The Gators (comfort clog footwear) ──
    const existingGators = await prisma.product.findUnique({ where: { slug: GATORS_SLUG } });
    console.log("The Gators product check:", existingGators ? "Found" : "Not found");
    if (!existingGators) {
      const gatorsProduct = await prisma.product.create({
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
        include: { variants: true },
      });
      console.log("Seeded product:", gatorsProduct.slug);
    } else {
      console.log("Updating existing The Gators product...");
      await prisma.product.update({
        where: { id: existingGators.id },
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
            product: { connect: { id: existingGators.id } },
            color: v.color,
            sku: v.sku,
            stock: v.stock,
          },
        });
      }
      const keepGatorSkus = GATORS_VARIANTS.map((v) => v.sku);
      await prisma.variant.deleteMany({
        where: {
          productId: existingGators.id,
          sku: { notIn: [...keepGatorSkus] },
        },
      });
      console.log("Updated The Gators product and variants.");
    }

    console.log('Seed script completed successfully.');
  } catch (e) {
    console.error('Seed error:', e);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Main catch:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
  });


