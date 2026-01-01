// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updatePrice() {
  try {
    const result = await prisma.product.updateMany({
      where: { slug: 'v3-slides' },
      data: { priceCents: 7500 }
    });
    console.log('Updated products:', result);
  } catch (error) {
    console.error('Error updating price:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePrice();
