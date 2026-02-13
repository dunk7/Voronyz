import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductThumbnail } from "@/lib/productImages";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = searchParams.get("limit");

  try {
    let products;

    if (query && query.trim().length > 0) {
      // Search mode
      products = await prisma.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          priceCents: true,
          currency: true,
          images: true,
          createdAt: true,
          updatedAt: true,
        },
        take: limit ? parseInt(limit) : undefined,
        orderBy: { createdAt: "desc" },
      });
    } else {
      // All products mode
      products = await prisma.product.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          priceCents: true,
          currency: true,
          images: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const productsWithThumbnail = products.map((p) => ({
      ...p,
      thumbnail: getProductThumbnail({ slug: p.slug, images: p.images }),
    }));

    return NextResponse.json({ products: productsWithThumbnail });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", products: [] },
      { status: 500 }
    );
  }
}
