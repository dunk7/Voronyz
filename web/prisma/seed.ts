const { PrismaClient } = require("@prisma/client");

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
            "World-class FDM printed slides with TPU 95A lattice lowers and breathable uppers. Engineered from precision 3D scans.",
          priceCents: 9900,
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
              { color: "green", sku: "V3-GRN", stock: 999 },
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
        green: 999,
        pink: 0,
      };

      console.log('Starting variant upserts...');
      for (const color of primaryColors) {
        const sku = `V3-${color.toUpperCase().slice(0,3)}`;
        console.log(`Upserting variant for ${color} (SKU: ${sku})`);
        await prisma.variant.upsert({
          where: { sku },
          update: { stock: stockMap[color as keyof typeof stockMap] },
          create: {
            productId: existing.id,
            color,
            sku,
            stock: stockMap[color as keyof typeof stockMap],
          },
        });
      }
      console.log("All variants updated.");
      console.log("Updated product and variants for: v3-slides");
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


