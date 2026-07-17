import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCatalogProducts } from "@/lib/ensureCatalogProducts";
import { getProductThumbnail } from "@/lib/productImages";
import { QUIZ_PROFILES, type QuizProfileId } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugsParam = searchParams.get("slugs") || "";
  const profileParam = (searchParams.get("profile") || "").trim() as QuizProfileId | "";

  let slugs = slugsParam
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (slugs.length === 0 && profileParam && QUIZ_PROFILES[profileParam]) {
    slugs = [...QUIZ_PROFILES[profileParam].productSlugs];
  }

  if (slugs.length === 0) {
    return NextResponse.json({ products: [] });
  }

  // Cap to a small recommendation set
  slugs = [...new Set(slugs)].slice(0, 4);

  try {
    await ensureCatalogProducts();

    const products = await prisma.product.findMany({
      where: { slug: { in: slugs } },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        priceCents: true,
        currency: true,
        images: true,
        primaryColors: true,
        sizes: true,
        variants: {
          select: {
            id: true,
            color: true,
            stock: true,
            sku: true,
            priceCents: true,
          },
        },
      },
    });

    const order = new Map(slugs.map((slug, index) => [slug, index]));
    products.sort(
      (a, b) =>
        (order.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.slug) ?? Number.MAX_SAFE_INTEGER)
    );

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        thumbnail: getProductThumbnail({ slug: p.slug, images: p.images }),
      })),
    });
  } catch (err) {
    console.error("Failed to load quiz products:", err);
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }
}
