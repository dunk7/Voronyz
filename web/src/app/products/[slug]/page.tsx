import { prisma } from "@/lib/prisma";
import AddToCart from "@/components/cart/AddToCart";
import V3Gallery from "@/components/V3Gallery";
import FAQ from "@/components/FAQ";
import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ensureCatalogProducts } from "@/lib/ensureCatalogProducts";
import {
  MAGIKID_SHOES_THUMBNAIL_URL,
  MAGIKID_SHOES_DESCRIPTION,
  MAGIKID_SHOES_HOW_ITS_MADE,
  MAGIKID_SHOES_META_DESCRIPTION,
  MAGIKID_SHOES_BASE_PRICE_CENTS,
  MAGIKID_SHOES_SHIPPED_PRICE_CENTS,
} from "@/lib/magikidShoesThumbnail";
import {
  TRAIL_MIX_DESCRIPTION,
  TRAIL_MIX_FLAVORS,
  TRAIL_MIX_HOW_ITS_MADE,
  TRAIL_MIX_IMAGES,
  TRAIL_MIX_NAME,
  TRAIL_MIX_SLUG,
  TRAIL_MIX_THUMBNAIL_URL,
} from "@/lib/trailMix";
import {
  isViolettePonybeadSlug,
  VIOLETTE_PONYBEAD_ANIMALS,
  VIOLETTE_PONYBEAD_DESCRIPTION,
  VIOLETTE_PONYBEAD_HOW_ITS_MADE,
  VIOLETTE_PONYBEAD_IMAGES,
  VIOLETTE_PONYBEAD_LEGACY_SLUG,
  VIOLETTE_PONYBEAD_NAME,
  VIOLETTE_PONYBEAD_SLUG,
  VIOLETTE_PONYBEAD_THUMBNAIL_URL,
} from "@/lib/violettePonybeadAnimals";
import {
  GATORS_DESCRIPTION,
  GATORS_HOW_ITS_MADE,
  GATORS_IMAGES,
  GATORS_NAME,
  GATORS_SLUG,
  GATORS_THUMBNAIL_URL,
} from "@/lib/gators";
import {
  FILAMENT_DESCRIPTION,
  FILAMENT_HOW_ITS_MADE,
  FILAMENT_IMAGES,
  FILAMENT_NAME,
  FILAMENT_SLUG,
  FILAMENT_THUMBNAIL_URL,
} from "@/lib/filament";
import {
  LATTICE_INSOLES_DESCRIPTION,
  LATTICE_INSOLES_HOW_ITS_MADE,
  LATTICE_INSOLES_IMAGES,
  LATTICE_INSOLES_NAME,
  LATTICE_INSOLES_SLUG,
  LATTICE_INSOLES_THUMBNAIL_URL,
} from "@/lib/latticeInsoles";
import { isAccessorySlug, isApparelSlug, isFootwearSlug, isHealthSlug } from "@/lib/productCategories";
import {
  apparelProductShopHref,
  apparelProductShopLabel,
  getApparelItem,
  getApparelImages,
  isObsoleteApparelSlug,
} from "@/lib/apparel";
import LogoLoader from "@/components/ui/LogoLoader";
import { redirect } from "next/navigation";

// Avoid build-time database access (SSG) in environments where the DB may not be reachable.
// This page is rendered on-demand.
export const dynamic = "force-dynamic";

/** Retired apparel product pages → remaining listing or Accessories hub. */
const OBSOLETE_APPAREL_PRODUCT_REDIRECTS: Record<string, string> = {
  "voronyz-technical-pants": "/products/voronyz-joggers",
  "voronyz-lounge-sweats": "/products/voronyz-joggers",
  "voronyz-lattice-shoe-trees": "/apparel/accessories",
  "voronyz-charm-bracelet": "/apparel/accessories",
  "voronyz-keychain": "/apparel/accessories",
  "voronyz-necklace": "/apparel/accessories",
  "voronyz-rc-car-stickers": "/apparel/accessories",
  "voronyz-nice-shirt": "/products/voronyz-oversized-tee",
};

type Media = {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
};

type ProductWithVariants = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[];
  primaryColors: string[];
  secondaryColors?: string[];
  sizes: string[];
  variants: {
    id: string;
    color: string;
    sku: string;
    stock: number;
    priceCents: number | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug.trim().toLowerCase() === VIOLETTE_PONYBEAD_LEGACY_SLUG) {
    redirect(`/products/${VIOLETTE_PONYBEAD_SLUG}`);
  }
  const obsoleteRedirect = OBSOLETE_APPAREL_PRODUCT_REDIRECTS[slug.trim().toLowerCase()];
  if (obsoleteRedirect || isObsoleteApparelSlug(slug)) {
    redirect(obsoleteRedirect ?? "/products/voronyz-joggers");
  }
  let product: ProductWithVariants;
  try {
    await ensureCatalogProducts();
    product = await prisma.product.findUnique({ 
      where: { slug }, 
      include: { 
        variants: {
          select: {
            id: true,
            color: true,
            stock: true,
            sku: true,
            priceCents: true,
          }
        }
      } 
    }) as ProductWithVariants;
  } catch (error) {
    console.error(`Failed to load product "${slug}":`, error);
    return (
      <div className="bg-texture-white">
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Something went wrong</h1>
          <p className="text-neutral-600 mb-6">We couldn&apos;t load this product right now. Please try again later.</p>
          <Link href="/products" className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }
  if (!product) return <div className="container py-12 text-neutral-900">Not found.</div>;

  // First and third gallery frames swapped so the preferred cover leads.
  const defaultImages = [
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
  ];
  const dragonflyImages = [
    "/products/dragonfly/InShot_20260212_153516456.jpg",
    "/products/dragonfly/InShot_20260212_153903491.jpg",
    "/products/dragonfly/InShot_20260212_154319265.jpg",
    "/products/dragonfly/InShot_20260212_154545771.jpg",
    "/products/dragonfly/InShot_20260212_154719489.jpg",
    "/products/dragonfly/InShot_20260212_154956597.jpg",
    "/products/dragonfly/InShot_20260212_155434004.jpg",
    "/products/dragonfly/InShot_20260212_155809942.jpg",
    "/products/dragonfly/InShot_20260212_160512335.jpg",
  ];
  const slipOnsImages = [
    "/products/slip-ons/InShot_20260405_202911983.jpg",
    "/products/slip-ons/InShot_20260405_203151152.jpg",
    "/products/slip-ons/InShot_20260405_203425292.jpg",
    "/products/slip-ons/InShot_20260405_203601045.jpg",
    "/products/slip-ons/InShot_20260405_203736918.jpg",
    "/products/slip-ons/InShot_20260405_203930832.jpg",
    "/products/slip-ons/InShot_20260405_204113872.jpg",
    "/products/slip-ons/InShot_20260405_204333303.jpg",
  ];
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
  const images = slug === "v3-slides"
    ? defaultImages
    : slug === "dragonfly"
    ? dragonflyImages
    : slug === "slip-ons"
    ? slipOnsImages
    : slug === "magikid-shoes"
    ? magikidShoesImages
    : slug === TRAIL_MIX_SLUG
    ? [...TRAIL_MIX_IMAGES]
    : isViolettePonybeadSlug(slug)
    ? [...VIOLETTE_PONYBEAD_IMAGES]
    : slug === GATORS_SLUG
    ? [...GATORS_IMAGES]
    : slug === FILAMENT_SLUG
    ? [...FILAMENT_IMAGES]
    : slug === LATTICE_INSOLES_SLUG
    ? [...LATTICE_INSOLES_IMAGES]
    : getApparelItem(slug)
    ? getApparelImages(getApparelItem(slug)!)
    : ((product.images as string[] | null) ?? defaultImages);
  const galleryMedia: Media[] = images.map((src) => ({ type: "image" as const, src, alt: product.name }));
  if (slug === "slip-ons") {
    galleryMedia.push({
      type: "video",
      src: "/products/slip-ons/C1150.mp4",
      poster: "/products/slip-ons/InShot_20260405_203151152.jpg",
    });
  }

  const isDragonfly = slug === "dragonfly";
  const isSlipOns = slug === "slip-ons";
  const isMagikidShoes = slug === "magikid-shoes";
  const isTrailMix = slug === TRAIL_MIX_SLUG;
  const isViolettePonybead = isViolettePonybeadSlug(slug);
  const isGators = slug === GATORS_SLUG;
  const isFilament = slug === FILAMENT_SLUG;
  const isLatticeInsoles = slug === LATTICE_INSOLES_SLUG;
  const apparelItem = getApparelItem(slug);
  const isApparel = Boolean(apparelItem);
  const shopHref = isAccessorySlug(slug)
    ? "/accessories"
    : isHealthSlug(slug)
      ? "/health"
      : isApparelSlug(slug)
        ? apparelProductShopHref(slug)
        : "/products";
  const shopLabel = isAccessorySlug(slug)
    ? "Back to Engineering"
    : isHealthSlug(slug)
      ? "Back to Collaborative"
      : isApparelSlug(slug)
        ? apparelProductShopLabel(slug)
        : "Back to Shop";
  const displayName = isTrailMix
      ? TRAIL_MIX_NAME
      : isViolettePonybead
        ? VIOLETTE_PONYBEAD_NAME
      : isGators
        ? GATORS_NAME
        : isFilament
          ? FILAMENT_NAME
          : isLatticeInsoles
            ? LATTICE_INSOLES_NAME
          : product.name;

  // Product-specific descriptions (oversized tee skips the top blurb — size picker covers fit)
  const displayDescription = slug === "v3-slides" 
    ? "Engineered for comfort, built to last. World-class FDM printed slides with TPU 90A lattice lowers and breathable uppers."
    : slug === "dragonfly"
    ? "Engineered for walking and active days, built to last. Lightweight, breathable 3D-printed sneakers featuring a custom lattice sole for unmatched cushioning and style. Available in five stunning colorways with fully customizable lace colors."
    : isMagikidShoes
    ? MAGIKID_SHOES_DESCRIPTION
    : isSlipOns
    ? "Engineered for easy everyday wear, built to last. Minimal 3D-printed slip-ons with a flexible lattice sole and a clean, easy-on silhouette. One body color per pair — black, grey, orange, and pink in stock; white temporarily unavailable."
    : isTrailMix
    ? TRAIL_MIX_DESCRIPTION
    : isViolettePonybead
    ? VIOLETTE_PONYBEAD_DESCRIPTION
    : isGators
    ? GATORS_DESCRIPTION
    : isFilament
    ? FILAMENT_DESCRIPTION
    : isLatticeInsoles
    ? LATTICE_INSOLES_DESCRIPTION
    : apparelItem?.slug === "voronyz-oversized-tee"
    ? ""
    : product.description;

  const trailMixColors = isTrailMix
    ? TRAIL_MIX_FLAVORS.map((flavor) => flavor.id)
    : isViolettePonybead
    ? VIOLETTE_PONYBEAD_ANIMALS.map((animal) => animal.id)
    : (product.primaryColors as string[]);

  const productBadges = (
    <div className="flex flex-wrap gap-2">
      {isTrailMix ? (
        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
          Sold Out
        </span>
      ) : isApparel && apparelItem?.comingSoon ? (
        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
          Pre-order
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.026M14.25 6.375h3.223c.398 0 .78.158 1.061.44l2.777 2.778a1.5 1.5 0 01.44 1.06V14.25m-8.25 0h8.25" />
          </svg>
          {isMagikidShoes ? "+$7 shipping" : "Free US shipping"}
        </span>
      )}

      {isViolettePonybead && (
        <>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">$10 each</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">4 animals</span>
        </>
      )}
      {isFilament && (
        <>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">1kg spool</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">TPU-90A</span>
        </>
      )}
      {isGators && (
        <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
          Low Stock
        </span>
      )}
      {isLatticeInsoles && (
        <>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">TPU lattice</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">S · M · L · XL</span>
        </>
      )}
      {!isTrailMix && !isApparel && !isFilament && !isLatticeInsoles && !isViolettePonybead && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">
          {isMagikidShoes ? "Made to order in <7 days" : "Made to order in <2 days"}
        </span>
      )}
      {!isMagikidShoes && !isTrailMix && !isApparel && !isFilament && !isLatticeInsoles && !isViolettePonybead && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">500 miles or 2 years</span>
      )}
      {isTrailMix && (
        <>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">$60</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">3 flavors</span>
        </>
      )}
      {isGators && (
        <>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Comfort clog</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">$85</span>
        </>
      )}
      {isDragonfly && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Custom lace colors</span>
      )}
      {isSlipOns && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Single-tone upper</span>
      )}
      {isMagikidShoes && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Magikid Lab pickup available</span>
      )}
    </div>
  );

  return (
    <div className="bg-texture-white">
      <div className="mx-auto w-full max-w-[1500px] pt-3 pb-12 lg:pt-5 lg:px-6">
        <div className="mb-3 lg:mb-5 px-4 sm:px-6 lg:px-0">
          <Link
            href={shopHref}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <span className="inline-flex items-center justify-center rounded-full p-1.5 ring-1 ring-black/10 hover:bg-black/5 bg-white">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            {shopLabel}
          </Link>
        </div>

        {/* Gallery-first retail layout: large photos lead, buy box sits beside */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-start">
          <div className="lg:col-span-8">
            {/* Full-bleed on mobile so product photos dominate the viewport */}
            <div className="lg:rounded-none -mx-0 sm:mx-0">
              <V3Gallery
                media={galleryMedia}
                aspect="square"
                fit={isFootwearSlug(slug) ? "contain" : "cover"}
                className="[&>div:first-of-type]:rounded-none sm:[&>div:first-of-type]:rounded-2xl lg:[&>div:first-of-type]:rounded-3xl [&>div:first-of-type]:ring-0 sm:[&>div:first-of-type]:ring-1"
              />
            </div>
          </div>
          <div className="lg:col-span-4 px-4 sm:px-6 lg:px-0">
            <div className="lg:sticky lg:top-20 space-y-5">
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight leading-tight">
                  {displayName}
                </h1>
                {productBadges}
                {displayDescription ? (
                  <p className="text-neutral-600 leading-relaxed text-[15px]">{displayDescription}</p>
                ) : null}
              </div>

              <Suspense fallback={
                <div className="h-[48px] rounded-full bg-neutral-100 flex items-center justify-center">
                  <LogoLoader size="sm" showBar={false} className="!gap-0 scale-75" />
                </div>
              }>
                <AddToCart
                  variants={product.variants}
                  primaryColors={isTrailMix || isViolettePonybead ? trailMixColors : (product.primaryColors as string[])}
                  productPriceCents={product.priceCents}
                  {...(isDragonfly && {
                    secondaryColors: (product.secondaryColors as string[]).filter(c => c.toLowerCase() !== "#007fff"),
                    secondaryLabel: "Lace Color",
                  })}
                  {...(isMagikidShoes && {
                    defaultGender: "kids" as const,
                    requireStudentName: true,
                    fulfillmentOptions: [
                      {
                        id: "pickup",
                        label: "Magikid Lab pickup",
                        priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
                        description: "$30 — no shipping fee",
                      },
                      {
                        id: "shipping",
                        label: "Ship to me",
                        priceCents: MAGIKID_SHOES_SHIPPED_PRICE_CENTS,
                        description: "$30 shoe + $7 shipping",
                      },
                    ],
                  })}
                  {...(isTrailMix && {
                    hideSizeSelector: true,
                    soldOut: true,
                    flavorOptions: TRAIL_MIX_FLAVORS,
                  })}
                  {...(isViolettePonybead && {
                    hideSizeSelector: true,
                    flavorLabel: "Animal",
                    flavorOptions: VIOLETTE_PONYBEAD_ANIMALS,
                  })}
                  {...(isFilament && {
                    hideSizeSelector: true,
                  })}
                  {...(isLatticeInsoles && {
                    useCatalogSizes: true,
                  })}
                  {...(isApparel && {
                    useCatalogSizes: true,
                    preOrder: Boolean(apparelItem?.comingSoon),
                    hideSizeSelector: apparelItem?.sizes.length === 1,
                  })}
                  sizes={product.sizes as string[]}
                  productName={displayName}
                  coverImage={(images[0] as string) || defaultImages[0]}
                  productSlug={slug}
                />
              </Suspense>

              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <Link href={shopHref} className="underline hover:no-underline">← {shopLabel}</Link>
                {!isTrailMix && !(isApparel && apparelItem?.comingSoon) && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isMagikidShoes ? "+$7 shipping" : "Free US shipping"}
                  </span>
                )}
                {isApparel && apparelItem?.comingSoon && (
                  <span className="inline-flex items-center gap-1 text-neutral-600 font-medium">
                    Pre-order · ships when ready
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-12">
        <div className="mt-10 overflow-hidden rounded-3xl ring-1 ring-black/5 bg-white">
          <div className="bg-black text-white px-6 py-4 text-sm font-medium">
            {isDragonfly
              ? "Crafted for you"
              : isMagikidShoes
                ? "Magikid edition"
                : isSlipOns
                  ? "Print + finish"
                  : isTrailMix
                      ? "Collaborative"
                      : isViolettePonybead
                        ? "Collaborative"
                      : isApparel
                        ? "Apparel"
                        : isGators
                          ? "Comfort clog"
                          : isFilament
                            ? "TPU-90A filament"
                            : isLatticeInsoles
                              ? "TPU lattice"
                            : "How it's made"}
          </div>
          <div className="px-6 py-5 text-neutral-700 leading-relaxed">
            {isDragonfly
              ? "Each pair of Dragonfly's is 3D-printed with our proprietary TPU lattice technology, delivering a springy, responsive feel with every step. The breathable upper is precision-engineered for airflow, and every pair ships with your choice of lace color — making each one uniquely yours."
              : isMagikidShoes
              ? MAGIKID_SHOES_HOW_ITS_MADE
              : isSlipOns
              ? "Slip Ons are printed in one piece per colorway for a seamless look, then finished for flex and daily wear. There is no secondary accent color — the shade you choose is the full shoe."
              : isTrailMix
              ? TRAIL_MIX_HOW_ITS_MADE
              : isViolettePonybead
              ? VIOLETTE_PONYBEAD_HOW_ITS_MADE
              : apparelItem?.slug === "voronyz-oversized-tee"
              ? "Cut oversized on purpose — soft hand-feel, roomy through the body and sleeves. Ready to ship in your size and color."
              : apparelItem?.slug === "voronyz-performance-socks"
              ? "Cushioned crew socks built for all-day wear and recovery. Pick your size and color — ready to ship."
              : isApparel && apparelItem?.comingSoon
              ? "Pre-order Voronyz Apparel — pay now to join the waitlist, and we ship when the drop arrives."
              : isApparel
              ? "Voronyz Apparel — soft hand-feel, clean fits, and free US shipping on domestic orders."
              : isGators
              ? GATORS_HOW_ITS_MADE
              : isFilament
              ? FILAMENT_HOW_ITS_MADE
              : isLatticeInsoles
              ? LATTICE_INSOLES_HOW_ITS_MADE
              : "Each pair takes a full day to print using our proprietary TPU blend. Following printing, we perform heat-treated post-processing to ensure exceptional quality, comfort, and durability."}
          </div>
        </div>

        {!isFilament && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">FAQs</h2>
          <FAQ
            items={isDragonfly ? [
              { q: "What colors are available?", a: "The Dragonfly's come in Black, White, Red, Azure Blue, and Pink — white is currently out of stock. Black is $5 less at $60. Laces can be any color you want!" },
              { q: "Are they true to size?", a: "Yes — we offer Men's, Women's, and Kids' sizing. They're designed for a comfortable, snug fit right out of the box." },
              { q: "How long does production take?", a: "Each pair is 3D-printed to order. Production takes about 1-2 days, then ships out next business day." },
              { q: "Is shipping really free?", a: "Yes! We offer free shipping on all domestic US orders. No minimum purchase required. We currently only ship within the US." },
              { q: "Can I wash them?", a: "Absolutely. The lattice sole and upper are fully washable — toss them in the washer on a gentle cycle." },
            ] : isMagikidShoes ? [
              { q: "What colors can I order?", a: "Black, grey, and pink are in stock. White and orange are listed but currently out of stock." },
              { q: "How does Magikid Lab pickup work?", a: "Choose pickup at checkout — you pay $30 for the shoes with no shipping fee. We'll email you when your pair is ready to collect in person at Magikid Lab." },
              { q: "How does shipping work?", a: "The shoes are $30. Shipping is an extra $7. Pickup at Magikid Lab is $30 with no shipping fee." },
              { q: "How long does production take?", a: "Made to order in under 7 days, then we ship or hold for pickup." },
            ] : isSlipOns ? [
              { q: "What colors can I order?", a: "Black, grey, orange, and pink are in stock — white is currently out of stock. Each pair is one solid body color (no two-tone option)." },
              { q: "Why is white unavailable?", a: "We're temporarily out of white material runs. Select another color or check back — inventory updates when we restock." },
              { q: "Are they true to size?", a: "Use the Men's / Women's / Kids' toggles on the product page to pick your usual US size." },
              { q: "How long does production take?", a: "About 1–2 days to print, then we ship the next business day." },
            ] : isTrailMix ? [
              { q: "What flavors are available?", a: "Wild Berry, Super Protein, and Chocolate — all currently sold out." },
              { q: "Does it come in sizes?", a: "No sizes — choose a flavor instead." },
              { q: "How much does it cost?", a: "$60 per bag when back in stock." },
              { q: "When will it restock?", a: "We're restocking the next batch soon. Check back on Collaborative." },
            ] : isViolettePonybead ? [
              { q: "What animals are available?", a: "Raccoon, chipmunk, skunk, and fox — each a handmade pony bead keychain with a silver lobster clasp." },
              { q: "How much do they cost?", a: "$10 per animal." },
              { q: "Does it come in sizes?", a: "No sizes — pick the animal style you want." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders." },
            ] : isApparel && !apparelItem?.comingSoon ? [
              { q: "What sizes are available?", a: apparelItem?.slug === "voronyz-performance-socks" ? "Socks run S–XL." : "This piece runs XS–XXL." },
              { q: "When will my order ship?", a: "Orders typically ship within a few business days. You'll get updates by email." },
              { q: "Where can I browse the lineup?", a: "Open Apparel to browse by type — Shirts, Sweaters, Scarves, and more. Accessories (hats, water bottles, shades, jewelry) live under their own Apparel section." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders." },
            ] : isApparel ? [
              { q: "What sizes are available?", a: "Most pieces run XS–XXL. Hats, scarves, bottles, cool shades, jewelry, lace locks, and drone parts are One Size. Socks use S–XL." },
              { q: "Can I pre-order coming soon pieces?", a: "Yes. Choose your color and size, then pay now to join the waitlist. We ship your order when that product arrives — timing can be a day or much longer depending on the drop." },
              { q: "When will my pre-order ship?", a: "As soon as we receive the product. You'll get updates by email. Pre-orders are paid reservations, not instant ship." },
              { q: "Where can I browse the lineup?", a: "Open Apparel to browse by type — Shirts, Sweaters, Scarves, and more. Accessories (hats, water bottles, shades, jewelry) live under their own Apparel section. Engineering is separate. Lattice Insoles are on All Footwear." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders once your pre-order ships." },
            ] : isGators ? [
              { q: "What is The Gators?", a: "A comfort clog named for the alligator 🐊 — closed toe, open back, thick cushioned platform, and easy slip-on wear for all-day comfort." },
              { q: "What colors are available?", a: "Black, pink, grey, and skin-tone tan. This is a new listing with low stock, so grab your size while pairs last." },
              { q: "How much do they cost?", a: "$85 per pair." },
              { q: "Are they true to size?", a: "Yes — use Men's, Women's, or Kids' sizing and pick your usual US size for a comfortable clog fit." },
              { q: "How long does production take?", a: "Printed to order in about 1–2 days, then ships the next business day." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders." },
            ] : isLatticeInsoles ? [
              { q: "What sizes are available?", a: "S, M, L, and XL — pick the band that matches your usual shoe size." },
              { q: "What colors can I order?", a: "Black and grey." },
              { q: "Will they fit my shoes?", a: "They're drop-in lattice cushions sized for everyday sneakers and Voronyz footwear. Trim lightly at the toe if you need a closer fit." },
              { q: "How long does production take?", a: "Printed to order in about 1–2 days, then ships the next business day." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders." },
            ] : [
              { q: "What if my size doesn't fit?", a: "They're going to fit and also be extremely comfortable. Trust the process" },
              { q: "Are they waterproof?", a: "Yes. 100% waterproof. Throw them in your washer to clean!" },
              { q: "How long does production take?", a: "After 24 hours of printing, orders are shipped out next day" },
            ]}
          />
        </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  // Static metadata for known products
  if (slug === "dragonfly") {
    const title = "The Dragonfly's – Voronyz";
    const description = "Lightweight 3D-printed sneakers with custom lattice sole and interchangeable laces. Starting at $60.";
    const images = ["/products/dragonfly/InShot_20260212_153516456.jpg"];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  if (slug === "slip-ons") {
    const title = "Slip Ons – Voronyz";
    const description =
      "Minimal 3D-printed slip-ons with a flexible lattice sole. $60. Black, grey, orange, and pink in stock; white temporarily unavailable.";
    const images = ["/products/slip-ons/InShot_20260405_203151152.jpg"];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  if (slug === "magikid-shoes") {
    const title = "Magikid Shoes – Voronyz";
    const description = MAGIKID_SHOES_META_DESCRIPTION;
    const images = [MAGIKID_SHOES_THUMBNAIL_URL];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  if (slug === TRAIL_MIX_SLUG) {
    const title = `${TRAIL_MIX_NAME} – Voronyz`;
    const description = TRAIL_MIX_DESCRIPTION;
    const images = [TRAIL_MIX_THUMBNAIL_URL];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  if (isViolettePonybeadSlug(slug)) {
    const title = `${VIOLETTE_PONYBEAD_NAME} – Voronyz`;
    const description = VIOLETTE_PONYBEAD_DESCRIPTION;
    const images = [VIOLETTE_PONYBEAD_THUMBNAIL_URL];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  if (slug === GATORS_SLUG) {
    const title = `${GATORS_NAME} – Voronyz`;
    const description = GATORS_DESCRIPTION;
    const images = [GATORS_THUMBNAIL_URL];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  if (slug === FILAMENT_SLUG) {
    const title = `${FILAMENT_NAME} – Voronyz`;
    const description = FILAMENT_DESCRIPTION;
    const images = [FILAMENT_THUMBNAIL_URL, ...FILAMENT_IMAGES];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  if (slug === LATTICE_INSOLES_SLUG) {
    const title = `${LATTICE_INSOLES_NAME} – Voronyz`;
    const description = LATTICE_INSOLES_DESCRIPTION;
    const images = [LATTICE_INSOLES_THUMBNAIL_URL, ...LATTICE_INSOLES_IMAGES];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  const apparelMeta = getApparelItem(slug);
  if (apparelMeta) {
    const title = `${apparelMeta.name} – Voronyz`;
    const description = apparelMeta.description;
    const images = getApparelImages(apparelMeta);
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  try {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (product) {
      const title = `${product.name} – Voronyz`;
      const description = product.description;
      const images = (product.images as string[] | null) ?? ["/products/v3-slides/InShot_20260212_194352014.jpg"]; 
      return {
        title,
        description,
        openGraph: { title, description, images },
        twitter: { card: "summary_large_image", title, description, images },
      };
    }
  } catch {}
  const fallbackTitle = "V3 Slides – Voronyz";
  const fallbackDescription = "Hands down most Comfortable slides in the world";
  return {
    title: fallbackTitle,
    description: fallbackDescription,
    openGraph: { title: fallbackTitle, description: fallbackDescription, images: ["/products/v3-slides/InShot_20260212_194352014.jpg"] },
    twitter: { card: "summary_large_image", title: fallbackTitle, description: fallbackDescription, images: ["/products/v3-slides/InShot_20260212_194352014.jpg"] },
  };
}


