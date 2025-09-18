import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.product.findUnique({ where: { slug: "v3-slides" } });
  if (!existing) {
    const product = await prisma.product.create({
      data: {
        slug: "v3-slides",
        name: "V3 Slides",
        description:
          "World-class FDM printed slides with TPU 95A lattice lowers and breathable uppers. Engineered from precision 3D scans.",
        priceCents: 9900,
        currency: "usd",
        images: ["/v3-front.jpg", "/v3-side.jpg", "/v3-top.jpg", "/v3-detail.jpg"],
        variants: {
          create: [
            { name: "Size 7", sku: "V3-7-BLK", priceCents: 9900, attributes: { size: 7, color: "black" } },
            { name: "Size 8", sku: "V3-8-BLK", priceCents: 9900, attributes: { size: 8, color: "black" } },
            { name: "Size 9", sku: "V3-9-BLK", priceCents: 9900, attributes: { size: 9, color: "black" } },
            { name: "Size 10", sku: "V3-10-BLK", priceCents: 9900, attributes: { size: 10, color: "black" } },
            { name: "Size 11", sku: "V3-11-BLK", priceCents: 9900, attributes: { size: 11, color: "black" } },
          ],
        },
      },
      include: { variants: true },
    });
    console.log("Seeded product:", product.slug);
  } else {
    console.log("Product already exists: v3-slides");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


