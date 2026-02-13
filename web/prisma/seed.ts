import { PrismaClient } from "@prisma/client";

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
          priceCents: 7500,
          currency: "usd",
          images: ["/v3-front.jpg", "/v3-side.jpg", "/v3-top.jpg", "/v3-detail.jpg"],
          primaryColors: ["black", "white", "grey", "green", "pink"],
          secondaryColors: ["black", "white", "grey", "green", "blue", "red", "maroon", "pink", "purple"],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
          variants: {
            create: [
              { color: "black", sku: "V3-BLK", stock: 999 },
              { color: "white", sku: "V3-WHT", stock: 999 },
              { color: "grey", sku: "V3-GRY", stock: 999 },
              { color: "green", sku: "V3-GRN", stock: 0 },  // Out of stock
              { color: "pink", sku: "V3-PNK", stock: 0 },  // Out of stock
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
          primaryColors: ["black", "white", "grey", "green", "pink"],
          secondaryColors: ["black", "white", "grey", "green", "blue", "red", "maroon", "pink", "purple"],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
        },
      });
      console.log('Product arrays updated.');

      // Upsert variants for each primary color
      const primaryColors = ["black", "white", "grey", "green", "pink"];
      const stockMap = {
        black: 999,
        white: 999,
        grey: 999,
        green: 0,
        pink: 0,
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
          priceCents: 9500,
          currency: "usd",
          images: [
            "/Dragonfly/InShot_20260212_153516456.jpg",
            "/Dragonfly/InShot_20260212_153903491.jpg",
            "/Dragonfly/InShot_20260212_154319265.jpg",
            "/Dragonfly/InShot_20260212_154545771.jpg",
            "/Dragonfly/InShot_20260212_154719489.jpg",
            "/Dragonfly/InShot_20260212_154956597.jpg",
            "/Dragonfly/InShot_20260212_155434004.jpg",
            "/Dragonfly/InShot_20260212_155809942.jpg",
            "/Dragonfly/InShot_20260212_160512335.jpg",
          ],
          primaryColors: ["black", "white", "red", "#007FFF"],
          secondaryColors: ["black", "white", "grey", "red", "#007FFF", "green", "blue", "maroon", "pink", "purple", "orange", "yellow", "navy", "teal"],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
          variants: {
            create: [
              { color: "black", sku: "DF-BLK", stock: 999, priceCents: 9000 },
              { color: "white", sku: "DF-WHT", stock: 999, priceCents: 9500 },
              { color: "red", sku: "DF-RED", stock: 999, priceCents: 9500 },
              { color: "#007FFF", sku: "DF-AZR", stock: 999, priceCents: 9500 },
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
          priceCents: 9500,
          images: [
            "/Dragonfly/InShot_20260212_153516456.jpg",
            "/Dragonfly/InShot_20260212_153903491.jpg",
            "/Dragonfly/InShot_20260212_154319265.jpg",
            "/Dragonfly/InShot_20260212_154545771.jpg",
            "/Dragonfly/InShot_20260212_154719489.jpg",
            "/Dragonfly/InShot_20260212_154956597.jpg",
            "/Dragonfly/InShot_20260212_155434004.jpg",
            "/Dragonfly/InShot_20260212_155809942.jpg",
            "/Dragonfly/InShot_20260212_160512335.jpg",
          ],
          primaryColors: ["black", "white", "red", "#007FFF"],
          secondaryColors: ["black", "white", "grey", "red", "#007FFF", "green", "blue", "maroon", "pink", "purple", "orange", "yellow", "navy", "teal"],
          sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
        },
      });

      // Upsert Dragonfly variants
      const dfVariants = [
        { color: "black", sku: "DF-BLK", stock: 999, priceCents: 9000 },
        { color: "white", sku: "DF-WHT", stock: 999, priceCents: 9500 },
        { color: "red", sku: "DF-RED", stock: 999, priceCents: 9500 },
        { color: "#007FFF", sku: "DF-AZR", stock: 999, priceCents: 9500 },
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


