import { prisma } from "@/lib/prisma";
import AddToCart from "@/components/cart/AddToCart";
import GunHolsterPurchase from "@/components/GunHolsterPurchase";
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
  GUN_HOLSTER_DESCRIPTION,
  GUN_HOLSTER_HOW_ITS_MADE,
  GUN_HOLSTER_IMAGES,
  GUN_HOLSTER_NAME,
  GUN_HOLSTER_SLUG,
  GUN_HOLSTER_THUMBNAIL_URL,
} from "@/lib/gunHolster";
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
import { isAccessorySlug, isApparelSlug, isHealthSlug } from "@/lib/productCategories";
import {
  apparelProductShopHref,
  apparelProductShopLabel,
  getApparelItem,
  getApparelImages,
  getApparelSubcategory,
} from "@/lib/apparel";
import LogoLoader from "@/components/ui/LogoLoader";

// Avoid build-time database access (SSG) in environments where the DB may not be reachable.
// This page is rendered on-demand.
export const dynamic = "force-dynamic";

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
    : slug === GUN_HOLSTER_SLUG
    ? [...GUN_HOLSTER_IMAGES]
    : slug === TRAIL_MIX_SLUG
    ? [...TRAIL_MIX_IMAGES]
    : slug === GATORS_SLUG
    ? [...GATORS_IMAGES]
    : slug === FILAMENT_SLUG
    ? [...FILAMENT_IMAGES]
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
  const isGunHolster = slug === GUN_HOLSTER_SLUG;
  const isTrailMix = slug === TRAIL_MIX_SLUG;
  const isGators = slug === GATORS_SLUG;
  const isFilament = slug === FILAMENT_SLUG;
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
  const displayName = isGunHolster
    ? GUN_HOLSTER_NAME
    : isTrailMix
      ? TRAIL_MIX_NAME
      : isGators
        ? GATORS_NAME
        : isFilament
          ? FILAMENT_NAME
          : product.name;

  // Product-specific descriptions
  const displayDescription = slug === "v3-slides" 
    ? "World-class FDM printed slides with TPU 90A lattice lowers and breathable uppers. Engineered from precision 3D scans."
    : slug === "dragonfly"
    ? "Lightweight, breathable 3D-printed sneakers featuring a custom lattice sole for unmatched cushioning and style. Available in four stunning colorways with fully customizable lace colors."
    : isMagikidShoes
    ? MAGIKID_SHOES_DESCRIPTION
    : isSlipOns
    ? "Minimal 3D-printed slip-ons with a flexible lattice sole and a clean, easy-on silhouette. One body color per pair — black, grey, orange in stock; white temporarily unavailable."
    : isGunHolster
    ? GUN_HOLSTER_DESCRIPTION
    : isTrailMix
    ? TRAIL_MIX_DESCRIPTION
    : isGators
    ? GATORS_DESCRIPTION
    : isFilament
    ? FILAMENT_DESCRIPTION
    : product.description;

  const holsterVariants = isGunHolster
    ? product.variants.filter((variant) => variant.color.toLowerCase() === "black")
    : product.variants;
  const holsterColors = isGunHolster ? ["black"] : (product.primaryColors as string[]);
  const trailMixColors = isTrailMix
    ? TRAIL_MIX_FLAVORS.map((flavor) => flavor.id)
    : (product.primaryColors as string[]);

  return (
    <div className="bg-texture-white">
      <div className="container pt-4 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Link href={shopHref} className="inline-flex items-center justify-center rounded-full p-2 ring-1 ring-black/10 hover:bg-black/5 text-neutral-600 hover:text-neutral-900 transition-colors bg-white" aria-label={shopLabel}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="w-px h-5 bg-neutral-200" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">{displayName}</h1>
        </div>
        
        <div className="mb-8 space-y-4">
          <p className="text-neutral-700 leading-relaxed">{displayDescription}</p>
          <div className="flex flex-wrap gap-2">
            {isTrailMix ? (
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                Sold Out
              </span>
            ) : isApparel ? (
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
            {isGators && (
              <>
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  New Listing
                </span>
                <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                  Low Stock
                </span>
              </>
            )}
            {isFilament && (
              <>
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  New Listing
                </span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">1kg spool</span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">TPU-90A</span>
              </>
            )}
            {!isTrailMix && !isApparel && !isFilament && (
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">
                {isMagikidShoes ? "Made to order in <7 days" : "Made to order in <2 days"}
              </span>
            )}
            {!isMagikidShoes && !isGunHolster && !isTrailMix && !isApparel && !isFilament && (
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">500 miles or 2 years</span>
            )}
            {isApparel && apparelItem && (
              <>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">
                  {getApparelSubcategory(apparelItem.subcategory)?.label ?? "Apparel"}
                </span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">
                  {apparelItem.sizes.join(" · ")}
                </span>
              </>
            )}
            {isGunHolster && (
              <>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Glock 43x</span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Carbon fiber nylon</span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">OWB &amp; IWB</span>
              </>
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
        </div>

        {isGunHolster ? (
          <Suspense fallback={
            <div className="h-[320px] rounded-3xl bg-neutral-100 flex items-center justify-center">
              <LogoLoader size="md" />
            </div>
          }>
            <GunHolsterPurchase
              variants={holsterVariants}
              primaryColors={holsterColors}
              productPriceCents={product.priceCents}
              productName={displayName}
              productSlug={slug}
            />
          </Suspense>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <V3Gallery media={galleryMedia} />
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-20 space-y-6">
              <Suspense fallback={
                <div className="h-[48px] rounded-full bg-neutral-100 flex items-center justify-center">
                  <LogoLoader size="sm" showBar={false} className="!gap-0 scale-75" />
                </div>
              }>
                <AddToCart
                  variants={product.variants}
                  primaryColors={isTrailMix ? trailMixColors : (product.primaryColors as string[])}
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
                  {...(isFilament && {
                    hideSizeSelector: true,
                  })}
                  {...(isApparel && {
                    useCatalogSizes: true,
                    preOrder: true,
                    hideSizeSelector: apparelItem?.sizes.length === 1,
                  })}
                  sizes={product.sizes as string[]}
                  productName={displayName}
                  coverImage={(images[0] as string) || defaultImages[0]}
                  productSlug={slug}
                  promoHint={undefined}
                />
              </Suspense>

              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <Link href={shopHref} className="underline hover:no-underline">← {shopLabel}</Link>
                {!isTrailMix && !isApparel && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isMagikidShoes ? "+$7 shipping" : "Free US shipping"}
                  </span>
                )}
                {isApparel && (
                  <span className="inline-flex items-center gap-1 text-neutral-600 font-medium">
                    Pre-order · ships when ready
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {isGunHolster && (
          <div className="mt-6 flex items-center gap-4 text-xs text-neutral-500">
            <Link href={shopHref} className="underline hover:no-underline">← {shopLabel}</Link>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free US shipping
            </span>
          </div>
        )}
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
                  : isGunHolster
                    ? "Carbon fiber nylon"
                    : isTrailMix
                      ? "Collaborative"
                      : isApparel
                        ? "Apparel"
                        : isGators
                          ? "Comfort clog"
                          : isFilament
                            ? "TPU-90A filament"
                            : "How it's made"}
          </div>
          <div className="px-6 py-5 text-neutral-700 leading-relaxed">
            {isDragonfly
              ? "Each pair of Dragonfly's is 3D-printed with our proprietary TPU lattice technology, delivering a springy, responsive feel with every step. The breathable upper is precision-engineered for airflow, and every pair ships with your choice of lace color — making each one uniquely yours."
              : isMagikidShoes
              ? MAGIKID_SHOES_HOW_ITS_MADE
              : isSlipOns
              ? "Slip Ons are printed in one piece per colorway for a seamless look, then finished for flex and daily wear. There is no secondary accent color — the shade you choose is the full shoe."
              : isGunHolster
              ? GUN_HOLSTER_HOW_ITS_MADE
              : isTrailMix
              ? TRAIL_MIX_HOW_ITS_MADE
              : isApparel
              ? "Voronyz Apparel is designed for a clean modern fit — consistent fabrics, considered proportions, and colorways that work across the full lineup. These pieces are available for pre-order: pay now to join the waitlist, and we'll ship when the drop arrives."
              : isGators
              ? GATORS_HOW_ITS_MADE
              : isFilament
              ? FILAMENT_HOW_ITS_MADE
              : "Each pair takes a full day to print using our proprietary TPU blend. Following printing, we perform heat-treated post-processing to ensure exceptional quality, comfort, and durability."}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">FAQs</h2>
          <FAQ
            items={isDragonfly ? [
              { q: "What colors are available?", a: "The Dragonfly's come in Black, White, Red, and Azure Blue — white is currently out of stock. Black is $5 less at $60. Laces can be any color you want!" },
              { q: "Are they true to size?", a: "Yes — we offer Men's, Women's, and Kids' sizing. They're designed for a comfortable, snug fit right out of the box." },
              { q: "How long does production take?", a: "Each pair is 3D-printed to order. Production takes about 1-2 days, then ships out next business day." },
              { q: "Is shipping really free?", a: "Yes! We offer free shipping on all domestic US orders. No minimum purchase required. We currently only ship within the US." },
              { q: "Can I wash them?", a: "Absolutely. The lattice sole and upper are fully washable — toss them in the washer on a gentle cycle." },
            ] : isMagikidShoes ? [
              { q: "What colors can I order?", a: "Black and grey are in stock. White and orange are listed but currently out of stock." },
              { q: "How does Magikid Lab pickup work?", a: "Choose pickup at checkout — you pay $30 for the shoes with no shipping fee. We'll email you when your pair is ready to collect in person at Magikid Lab." },
              { q: "How does shipping work?", a: "The shoes are $30. Shipping is an extra $7. Pickup at Magikid Lab is $30 with no shipping fee." },
              { q: "How long does production take?", a: "Made to order in under 7 days, then we ship or hold for pickup." },
            ] : isSlipOns ? [
              { q: "What colors can I order?", a: "Black, grey, white, and orange are listed — white is currently out of stock. Each pair is one solid body color (no two-tone option)." },
              { q: "Why is white unavailable?", a: "We're temporarily out of white material runs. Select another color or check back — inventory updates when we restock." },
              { q: "Are they true to size?", a: "Use the Men's / Women's / Kids' toggles on the product page to pick your usual US size." },
              { q: "How long does production take?", a: "About 1–2 days to print, then we ship the next business day." },
            ] : isGunHolster ? [
              { q: "What firearm does it fit?", a: "Molded specifically for the Glock 43x." },
              { q: "What material is it?", a: "Carbon fiber nylon — stiff, lightweight, and built to keep a solid carry profile day after day." },
              { q: "What's the difference between OWB and IWB?", a: "OWB rides outside the waistband for faster access. IWB tucks inside the waistband for a lower-profile carry. Same Glock 43x shell family — pick the mount that matches how you carry." },
              { q: "What color is available?", a: "Black only." },
              { q: "How long does production take?", a: "Printed to order in about 1–2 days, then ships the next business day." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders." },
            ] : isTrailMix ? [
              { q: "What flavors are available?", a: "Wild Berry, Super Protein, and Chocolate — all currently sold out." },
              { q: "Does it come in sizes?", a: "No sizes — choose a flavor instead." },
              { q: "How much does it cost?", a: "$60 per bag when back in stock." },
              { q: "When will it restock?", a: "We're restocking the next batch soon. Check back on Collaborative." },
            ] : isApparel ? [
              { q: "What sizes are available?", a: "Most pieces run XS–XXL. Hats, scarves, bottles, cool shades, jewelry, keychains, lace locks, drone parts, and RC stickers are One Size. Socks use S–XL. Lattice Insoles and Lattice Shoe Trees use S–XL / S–L sizing." },
              { q: "Can I pre-order coming soon pieces?", a: "Yes. Choose your color and size, then pay now to join the waitlist. We ship your order when that product arrives — timing can be a day or much longer depending on the drop." },
              { q: "When will my pre-order ship?", a: "As soon as we receive the product. You'll get updates by email. Pre-orders are paid reservations, not instant ship." },
              { q: "Where can I browse the lineup?", a: "Open Apparel to browse by type — Shirts, Hats, Scarves, Bottles, and more. Accessories (insoles, shades, jewelry) live under their own Apparel section. Engineering is separate." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders once your pre-order ships." },
            ] : isGators ? [
              { q: "What is The Gators?", a: "A comfort clog named for the alligator 🐊 — closed toe, open back, thick cushioned platform, and easy slip-on wear for all-day comfort." },
              { q: "What colors are available?", a: "Black, pink, grey, and skin-tone tan. This is a new listing with low stock, so grab your size while pairs last." },
              { q: "How much do they cost?", a: "$85 per pair." },
              { q: "Are they true to size?", a: "Yes — use Men's, Women's, or Kids' sizing and pick your usual US size for a comfortable clog fit." },
              { q: "How long does production take?", a: "Printed to order in about 1–2 days, then ships the next business day." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders." },
            ] : isFilament ? [
              { q: "What is TPU-90A Filament?", a: "Flexible thermoplastic polyurethane at 90 Shore A — the same material we use to make Voronyz footwear. Great for printing footwear, flexible parts, and anything that needs to bend without breaking." },
              { q: "What colors are available?", a: "Pink, black, grey, and white. All 1kg spools." },
              { q: "What print settings should I use?", a: "Print temperature 220°C. Bed temperature 0 — no heated bed needed. Diameter is 1.75mm." },
              { q: "Is shipping free?", a: "Yes — free shipping on every spool for domestic US orders." },
            ] : [
              { q: "What if my size doesn't fit?", a: "They're going to fit and also be extremely comfortable. Trust the process" },
              { q: "Are they waterproof?", a: "Yes. 100% waterproof. Throw them in your washer to clean!" },
              { q: "How long does production take?", a: "After 24 hours of printing, orders are shipped out next day" },
            ]}
          />
        </div>
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
      "Minimal 3D-printed slip-ons with a flexible lattice sole. $60. Black, grey, and orange in stock; white temporarily unavailable.";
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

  if (slug === GUN_HOLSTER_SLUG) {
    const title = `${GUN_HOLSTER_NAME} – Voronyz`;
    const description = GUN_HOLSTER_DESCRIPTION;
    const images = [GUN_HOLSTER_THUMBNAIL_URL, ...GUN_HOLSTER_IMAGES];
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


