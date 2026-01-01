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
    // Fallback mock data for development
    const mockProducts = [{
      id: "demo-product",
      slug: "v3-slides",
      name: "Voronyz V3 Slides",
      description: "Custom 3D printed slides",
      priceCents: 7500,
      currency: "usd",
      images: ["/v3.4/Lumii_20251207_030803361.jpg"],
      thumbnail: "/v3.4/Lumii_20251207_031125508.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    }];
    return NextResponse.json({ products: mockProducts });
  }
}
