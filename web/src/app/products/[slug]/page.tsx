import { prisma } from "@/lib/prisma";
import PdpGalleryBuyBox from "@/components/products/PdpGalleryBuyBox";
import FAQ from "@/components/FAQ";
import Link from "next/link";
import { Metadata } from "next";
import { ensureCatalogProducts } from "@/lib/ensureCatalogProducts";
import {
  MAGIKID_SHOES_COVER,
  MAGIKID_SHOES_IMAGES,
  MAGIKID_SHOES_DESCRIPTION,
  MAGIKID_SHOES_HOW_ITS_MADE,
  MAGIKID_SHOES_META_DESCRIPTION,
  MAGIKID_SHOES_BASE_PRICE_CENTS,
  MAGIKID_SHOES_SHIPPED_PRICE_CENTS,
  magikidCatalogProduct,
} from "@/lib/magikidShoesThumbnail";
import MagikidShoesStory from "@/components/products/MagikidShoesStory";
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
  FILAMENT_COMPARE_AT_CENTS,
  FILAMENT_DESCRIPTION,
  FILAMENT_IMAGES,
  FILAMENT_MATERIALS,
  FILAMENT_NAME,
  FILAMENT_PRIMARY_COLORS,
  FILAMENT_SLUG,
  FILAMENT_THUMBNAIL_URL,
} from "@/lib/filament";
import {
  STL_FILES_DESCRIPTION,
  STL_FILES_HOW_ITS_MADE,
  STL_FILES_IMAGES,
  STL_FILES_NAME,
  STL_FILES_SLUG,
  STL_FILES_THUMBNAIL_URL,
  stlFilesCatalogProduct,
} from "@/lib/stlFiles";
import {
  LATTICE_INSOLES_DESCRIPTION,
  LATTICE_INSOLES_HOW_ITS_MADE,
  LATTICE_INSOLES_IMAGES,
  LATTICE_INSOLES_NAME,
  LATTICE_INSOLES_SLUG,
  latticeInsolesCatalogProduct,
} from "@/lib/latticeInsoles";
import { isAccessorySlug, isApparelSlug, isFootwearSlug, isHealthSlug } from "@/lib/productCategories";
import { DRAGONFLY_DESCRIPTION, SLIP_ONS_DESCRIPTION, SLIP_ONS_PRICE_CENTS } from "@/lib/footwear";
import {
  apparelCatalogProduct,
  apparelProductShopHref,
  apparelProductShopLabel,
  apparelUnavailableSizes,
  getApparelItem,
  getApparelImages,
  getApparelImagesForColor,
  isObsoleteApparelSlug,
} from "@/lib/apparel";
import { redirect } from "next/navigation";

// Avoid build-time database access (SSG) in environments where the DB may not be reachable.
// This page is rendered on-demand.
export const dynamic = "force-dynamic";

/** Retired apparel product pages → remaining listing or Apparel/Accessories hub. */
const OBSOLETE_APPAREL_PRODUCT_REDIRECTS: Record<string, string> = {
  "voronyz-technical-pants": "/apparel",
  "voronyz-lounge-sweats": "/apparel",
  "voronyz-lattice-shoe-trees": "/apparel/accessories",
  "voronyz-charm-bracelet": "/apparel/accessories",
  "voronyz-keychain": "/products/voronyz-stickers",
  "voronyz-necklace": "/apparel/accessories",
  "voronyz-rc-car-stickers": "/apparel/accessories",
  "voronyz-nice-shirt": "/products/voronyz-oversized-tee",
  "voronyz-shorts": "/apparel",
  "voronyz-joggers": "/apparel",
  "voronyz-shell-jacket": "/apparel",
  "voronyz-scarf": "/apparel",
  "voronyz-uv-hat": "/apparel/accessories",
  "voronyz-water-bottle": "/apparel/accessories",
  "voronyz-lock-squirt-bottle": "/apparel/accessories",
  "voronyz-performance-socks": "/apparel",
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

function FilamentPrintNotes() {
  return (
    <div className="space-y-8 text-sm sm:text-base">
      <section>
        <h3 className="text-base font-semibold text-neutral-900">TPU 90A</h3>
        <p className="mt-2">
          Regular flexible TPU. Hardness stays at 90 Shore A. 1.75mm, 1kg. Pink and black.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Nozzle 220–240°C. Start around 225°C.</li>
          <li>Bed 40–60°C. A cool bed works if you use a glue stick.</li>
          <li>Speed 20–40 mm/s. Direct drive is the easier setup.</li>
          <li>Keep retraction short, or turn it off if the filament buckles.</li>
          <li>Dry the spool before a long print. Wet TPU strings and pops.</li>
        </ul>
      </section>
      <section>
        <h3 className="text-base font-semibold text-neutral-900">TPU Air</h3>
        <p className="mt-2">
          Foaming TPU, black only. Heat is the softness control. A cooler nozzle stays denser and firmer, up around the low 90s A. A hotter nozzle foams the plastic, so the part gets lighter and softer, down through the 70s A. One kilogram prints a lot more volume once it is foaming.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Nozzle 210–270°C. 260°C is a solid place to start.</li>
          <li>Bed 40–60°C. Glue stick or PEI helps it stay down.</li>
          <li>Speed at or under 50 mm/s.</li>
          <li>Drop the flow as the temperature goes up. The filament expands, so a normal 100% flow over-extrudes.</li>
          <li>230–240°C: denser, firmer, flow about 85–90%.</li>
          <li>250°C: lighter, flow about 65–70%.</li>
          <li>260°C: a balanced foam, flow about 55–60%.</li>
          <li>270°C: softest and lightest, flow about 50–55%.</li>
          <li>Run a small cube first. Your printer, nozzle, and speed move these numbers.</li>
          <li>Dry it, and keep it in a sealed bag with desiccant.</li>
        </ul>
      </section>
    </div>
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug.trim().toLowerCase() === VIOLETTE_PONYBEAD_LEGACY_SLUG) {
    redirect(`/products/${VIOLETTE_PONYBEAD_SLUG}`);
  }
  const obsoleteRedirect = OBSOLETE_APPAREL_PRODUCT_REDIRECTS[slug.trim().toLowerCase()];
  if (obsoleteRedirect || isObsoleteApparelSlug(slug)) {
    redirect(obsoleteRedirect ?? "/apparel");
  }
  let product: ProductWithVariants | null = null;
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
    const catalogFallback = getApparelItem(slug);
    if (catalogFallback) {
      product = apparelCatalogProduct(catalogFallback);
    } else if (slug === "magikid-shoes") {
      product = magikidCatalogProduct();
    } else if (slug === STL_FILES_SLUG) {
      product = stlFilesCatalogProduct();
    } else if (slug === LATTICE_INSOLES_SLUG) {
      product = latticeInsolesCatalogProduct();
    } else {
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
  }
  if (!product) {
    const catalogFallback = getApparelItem(slug);
    if (catalogFallback) product = apparelCatalogProduct(catalogFallback);
    else if (slug === "magikid-shoes") product = magikidCatalogProduct();
    else if (slug === STL_FILES_SLUG) product = stlFilesCatalogProduct();
    else if (slug === LATTICE_INSOLES_SLUG) product = latticeInsolesCatalogProduct();
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
    "/products/dragonfly/InShot_20260212_153903491.jpg",
    "/products/dragonfly/InShot_20260212_153516456.jpg",
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
  const magikidShoesImages = [...MAGIKID_SHOES_IMAGES];
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
    : slug === STL_FILES_SLUG
    ? [...STL_FILES_IMAGES]
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
  const isStlFiles = slug === STL_FILES_SLUG;
  const isLatticeInsoles = slug === LATTICE_INSOLES_SLUG;
  const apparelItem = getApparelItem(slug);
  const isApparel = Boolean(apparelItem);
  const apparelColorImages = apparelItem
    ? Object.fromEntries(
        apparelItem.colors.map((color) => [color, getApparelImagesForColor(apparelItem, color)]),
      )
    : undefined;
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
          : isStlFiles
            ? STL_FILES_NAME
          : isLatticeInsoles
            ? LATTICE_INSOLES_NAME
          : apparelItem
            ? apparelItem.name
          : product.name;

  // Product-specific descriptions (oversized tee skips the top blurb — size picker covers fit)
  const displayDescription = slug === "v3-slides" 
    ? "Engineered for comfort, built to last. Lightweight slides with a foamed TPU lattice underfoot and a breathable upper."
    : slug === "dragonfly"
    ? DRAGONFLY_DESCRIPTION
    : isMagikidShoes
    ? MAGIKID_SHOES_DESCRIPTION
    : isSlipOns
    ? SLIP_ONS_DESCRIPTION
    : isTrailMix
    ? TRAIL_MIX_DESCRIPTION
    : isViolettePonybead
    ? VIOLETTE_PONYBEAD_DESCRIPTION
    : isGators
    ? GATORS_DESCRIPTION
    : isFilament
    ? FILAMENT_DESCRIPTION
    : isStlFiles
    ? STL_FILES_DESCRIPTION
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
          {isMagikidShoes ? "+$7 shipping" : isStlFiles ? "Digital file" : "Free US shipping"}
        </span>
      )}

      {isViolettePonybead && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">4 animals</span>
      )}
      {isFilament && (
        <>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">1kg · 1.75mm</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">TPU 90A or TPU Air</span>
        </>
      )}
      {isStlFiles && (
        <>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">STL file</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Print yourself</span>
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
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">US shoe sizes</span>
        </>
      )}
      {apparelItem?.slug === "voronyz-stickers" && (
        <>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">3-pack vinyl</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Weatherproof</span>
        </>
      )}
      {!isTrailMix && !isApparel && !isFilament && !isStlFiles && !isLatticeInsoles && !isViolettePonybead && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">
          {isMagikidShoes ? "Made to order in <7 days" : "Made to order in <2 days"}
        </span>
      )}
      {!isMagikidShoes && !isTrailMix && !isApparel && !isFilament && !isStlFiles && !isLatticeInsoles && !isViolettePonybead && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">500 miles or 2 years</span>
      )}
      {isTrailMix && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">3 flavors</span>
      )}
      {isGators && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Comfort clog</span>
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
        <PdpGalleryBuyBox
          media={galleryMedia}
          colorImages={apparelColorImages}
          leadWhiteSlipOns={isSlipOns}
          fit={isFootwearSlug(slug) ? "contain" : "cover"}
          galleryClassName="[&>div:first-of-type]:rounded-none sm:[&>div:first-of-type]:rounded-2xl lg:[&>div:first-of-type]:rounded-3xl [&>div:first-of-type]:ring-0 sm:[&>div:first-of-type]:ring-1"
          addToCartProps={{
            variants: product.variants,
            primaryColors: isFilament
              ? [...FILAMENT_PRIMARY_COLORS]
              : isTrailMix || isViolettePonybead
                ? trailMixColors
                : (product.primaryColors as string[]),
            productPriceCents: product.priceCents,
            ...(isDragonfly && {
              secondaryColors: (product.secondaryColors as string[]).filter(c => c.toLowerCase() !== "#007fff"),
              secondaryLabel: "Lace Color",
            }),
            ...(isMagikidShoes && {
              defaultGender: "kids" as const,
              requireStudentName: true,
              fulfillmentOptions: [
                {
                  id: "pickup",
                  label: "Magikid Lab pickup",
                  priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
                  description: "No shipping fee",
                },
                {
                  id: "shipping",
                  label: "Ship to me",
                  priceCents: MAGIKID_SHOES_SHIPPED_PRICE_CENTS,
                  description: "Includes shipping",
                },
              ],
            }),
            ...(isTrailMix && {
              hideSizeSelector: true,
              soldOut: true,
              flavorOptions: TRAIL_MIX_FLAVORS,
            }),
            ...(isViolettePonybead && {
              hideSizeSelector: true,
              flavorLabel: "Animal",
              flavorOptions: VIOLETTE_PONYBEAD_ANIMALS,
            }),
            ...(isFilament && {
              hideSizeSelector: true,
              compareAtCents: FILAMENT_COMPARE_AT_CENTS,
              filamentMaterials: FILAMENT_MATERIALS.map((material) => ({
                id: material.id,
                label: material.label,
                colors: material.colors.map((color) => ({
                  id: color.id,
                  label: color.label,
                  swatch: color.swatch,
                  ...("note" in color ? { note: color.note } : {}),
                })),
              })),
            }),
            ...(isStlFiles && {
              hideSizeSelector: true,
              hideColorSelector: true,
            }),
            ...(isApparel && {
              useCatalogSizes: true,
              preOrder: Boolean(apparelItem?.comingSoon),
              hideSizeSelector: apparelItem?.sizes.length === 1,
              unavailableColors: apparelItem?.outOfStockColors ?? [],
              unavailableSizes: apparelItem ? apparelUnavailableSizes(apparelItem) : [],
              sizePriceCents: apparelItem?.sizePriceCents ?? {},
            }),
            sizes: product.sizes as string[],
            productName: displayName,
            coverImage: (images[0] as string) || defaultImages[0],
            productSlug: slug,
            allowOutOfStockColorPreview: isSlipOns,
          }}
          footer={
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <Link href={shopHref} className="underline hover:no-underline">← {shopLabel}</Link>
              {!isTrailMix && !(isApparel && apparelItem?.comingSoon) && (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isMagikidShoes ? "+$7 shipping" : isStlFiles ? "Digital file" : "Free US shipping"}
                </span>
              )}
              {isApparel && apparelItem?.comingSoon && (
                <span className="inline-flex items-center gap-1 text-neutral-600 font-medium">
                  Pre-order · ships when ready
                </span>
              )}
            </div>
          }
        >
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight leading-tight">
              {displayName}
            </h1>
            {productBadges}
            {displayDescription ? (
              <p className="footwear-description">
                {displayDescription}
              </p>
            ) : null}
          </div>
        </PdpGalleryBuyBox>
      </div>

      <div className="container pb-12">
        {isMagikidShoes ? <MagikidShoesStory /> : null}
        <div className="mt-10 overflow-hidden rounded-3xl ring-1 ring-black/5 bg-white">
          <div className="bg-black text-white px-6 py-4 text-sm font-medium">
            {isDragonfly
              ? "Crafted for you"
              : isMagikidShoes
                ? "Magikid program"
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
                            ? "Print settings"
                            : isStlFiles
                              ? "STL file"
                            : isLatticeInsoles
                              ? "TPU lattice"
                            : "How it's made"}
          </div>
          <div className="px-6 py-5 text-neutral-700 leading-relaxed">
            {isFilament ? <FilamentPrintNotes /> : null}
            {!isFilament && (isDragonfly
              ? "3D-printed with our TPU lattice for a springy feel, a breathable upper, and your choice of lace color."
              : isMagikidShoes
              ? MAGIKID_SHOES_HOW_ITS_MADE
              : isSlipOns
              ? "Printed in one piece per colorway, then finished for flex and daily wear."
              : isTrailMix
              ? TRAIL_MIX_HOW_ITS_MADE
              : isViolettePonybead
              ? VIOLETTE_PONYBEAD_HOW_ITS_MADE
              : apparelItem?.slug === "voronyz-oversized-tee"
              ? "Cut oversized on purpose — soft hand-feel, roomy through the body and sleeves."
              : apparelItem?.slug === "voronyz-core-hoodie"
              ? "Heavyweight fleece with a clean, modern cut. Swipe to the second photo for the back."
              : apparelItem?.slug === "voronyz-stickers"
              ? "Kiss-cut weatherproof vinyl with three VORONYZ logo strips."
              : isApparel && apparelItem?.comingSoon
              ? "Pay now to join the waitlist. We ship when the drop arrives."
              : isApparel
              ? "Soft hand-feel and clean fits."
              : isGators
              ? GATORS_HOW_ITS_MADE
              : isStlFiles
              ? STL_FILES_HOW_ITS_MADE
              : isLatticeInsoles
              ? LATTICE_INSOLES_HOW_ITS_MADE
              : "Printed in foamed TPU, then finished to be light, cushioned, and ready to wear.")}
          </div>
        </div>

        {!isFilament && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">FAQs</h2>
          <FAQ
            items={isStlFiles ? [
              { q: "What do I get?", a: "The printable Voronyz Slip On STL — left, right, and the two-piece top/bottom files." },
              { q: "How do I download it?", a: "After checkout, the confirmation page has a download button for the zip." },
              { q: "What filament should I use?", a: "TPU-90A, the same material we print footwear with. We sell it on Engineering." },
              { q: "How much is it?", a: "$1 for the file. No shipping — it's a digital download." },
            ] : isDragonfly ? [
              { q: "What colors are available?", a: "The Dragonfly's come in Black, White, Red, Azure Blue, and Pink — white is currently out of stock. Laces can be any color you want!" },
              { q: "Are they true to size?", a: "Yes — we offer Men's, Women's, and Kids' sizing. They're designed for a comfortable, snug fit right out of the box." },
              { q: "How long does production take?", a: "Each pair is 3D-printed to order. Production takes about 1-2 days, then ships out next business day." },
              { q: "Is shipping really free?", a: "Yes! We offer free shipping on all domestic US orders. No minimum purchase required. We currently only ship within the US." },
              { q: "Can I wash them?", a: "Absolutely. The lattice sole and upper are fully washable — toss them in the washer on a gentle cycle." },
            ] : isMagikidShoes ? [
              { q: "Is this a public Voronyz shoe?", a: "No. This is a Magikid Robotics Lab program we run with them — footwear design camps for Magikid students. It is not a stock pair we sell to everybody." },
              { q: "What are the kids actually ordering?", a: "Their own design. In camp they start from our slip-on base and model their own holes, cutouts, and graphics. We print that student file. Put the student's name at checkout so we print the right pair — there isn't a finished off-the-shelf shoe to buy." },
              { q: "What colors can I order?", a: "Black, grey, and pink are in stock. White and orange are listed but currently out of stock. Color is the print color of the student's designed pair." },
              { q: "How does Magikid Lab pickup work?", a: "Choose pickup at checkout — you pay $30 for the printed student pair with no shipping fee. We'll email you when it's ready to collect in person at Magikid Lab." },
              { q: "How does shipping work?", a: "The pair is $30. Shipping is an extra $7. Pickup at Magikid Lab is $30 with no shipping fee." },
              { q: "How long does production take?", a: "Made to order in under 7 days, then we ship or hold for pickup." },
            ] : isSlipOns ? [
              { q: "What colors can I order?", a: "Black, grey, white, orange, and pink. Each pair is one solid body color (no two-tone option)." },
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
            ] : apparelItem?.slug === "voronyz-stickers" ? [
              { q: "What is included?", a: "One vinyl sheet with three stacked VORONYZ logo strips — peel and apply each strip, or keep the sheet together." },
              { q: "Where can I put them?", a: "Laptops, bottles, notebooks, boards, cases — any clean, smooth surface. The vinyl is weatherproof." },
              { q: "How much do they cost?", a: "$8 per sheet, with free shipping on domestic US orders." },
              { q: "Does it come in sizes or colors?", a: "One size, one color — charcoal bars with white VORONYZ lettering, matching the physical stickers." },
              { q: "When will my order ship?", a: "Orders typically ship within a few business days. You'll get updates by email." },
            ] : isApparel && !apparelItem?.comingSoon ? [
              { q: "What sizes are available?", a: apparelItem?.slug === "voronyz-oversized-tee"
                ? "The Oversized Tee ships in XS, S, M, L, XL, and XXL. Smaller sizes cost less than Medium; larger sizes cost more."
                : apparelItem?.slug === "voronyz-core-hoodie"
                  ? "XS–XXL. Large is priced under Medium — the deal size on this hoodie."
                : "This piece runs XS–XXL." },
              { q: "What colors are available?", a: apparelItem?.slug === "voronyz-oversized-tee"
                ? "Black, white, and grey are in stock. Pick a color to see the matching front and back shots."
                : apparelItem?.slug === "voronyz-core-hoodie"
                  ? "Black, grey, and white. Black uses the original hoodie photo; grey costs a little more, and white is the most expensive. The gallery updates to the selected color, with the back of the same hoodie on the second photo."
                  : apparelItem?.outOfStockColors?.includes("grey")
                  ? "Grey is currently out of stock. Choose another listed color."
                  : "Pick any listed color that is in stock." },
              ...(apparelItem?.slug === "voronyz-core-hoodie"
                ? [{ q: "How much does it cost?", a: "Price depends on size. Each hoodie is marked down about 60% from the listed compare-at — sale prices run from $74 (XS) to $99 (XXL), never under $70." }]
                : []),
              { q: "When will my order ship?", a: "Orders typically ship within a few business days. You'll get updates by email." },
              { q: "Where can I browse the lineup?", a: "Open Apparel to browse by type — Shirts, Sweaters, and more. Accessories (stickers, shades, jewelry, lace locks, drone parts) live under their own Apparel section." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders." },
            ] : isApparel ? [
              { q: "What sizes are available?", a: "Most pieces run XS–XXL. Stickers, cool shades, jewelry, lace locks, and drone parts are One Size." },
              { q: "What colors are available?", a: "Grey is currently out of stock on apparel. Other listed colors can be pre-ordered." },
              { q: "Can I pre-order coming soon pieces?", a: "Yes. Choose your color and size, then pay now to join the waitlist. We ship your order when that product arrives — timing can be a day or much longer depending on the drop." },
              { q: "When will my pre-order ship?", a: "As soon as we receive the product. You'll get updates by email. Pre-orders are paid reservations, not instant ship." },
              { q: "Where can I browse the lineup?", a: "Open Apparel to browse by type — Shirts, Sweaters, and more. Accessories (stickers, shades, jewelry, lace locks, drone parts) live under their own Apparel section. Engineering is separate. Lattice Insoles are on All Footwear." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders once your pre-order ships." },
            ] : isGators ? [
              { q: "What is The Gators?", a: "A comfort clog named for the alligator 🐊 — closed toe, open back, thick cushioned platform, and easy slip-on wear for all-day comfort." },
              { q: "What colors are available?", a: "Black, pink, grey, and skin-tone tan. This is a new listing with low stock, so grab your size while pairs last." },
              { q: "How much do they cost?", a: "$100 per pair." },
              { q: "Are they true to size?", a: "Yes — use Men's, Women's, or Kids' sizing and pick your usual US size for a comfortable clog fit." },
              { q: "How long does production take?", a: "Printed to order in about 1–2 days, then ships the next business day." },
              { q: "Is shipping free?", a: "Yes — free shipping on domestic US orders." },
            ] : isLatticeInsoles ? [
              { q: "What sizes are available?", a: "The same US Men's, Women's, and Kids' sizes as Voronyz shoes. Pick the size you wear in our footwear." },
              { q: "What colors can I order?", a: "Black and grey." },
              { q: "Will they fit my shoes?", a: "They're printed on the same size scale as Voronyz footwear. Order your usual US size for a drop-in fit in Voronyz shoes and everyday sneakers." },
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
    const description = "Lightweight 3D-printed sneakers with custom lattice sole and interchangeable laces. $160.";
    const images = ["/products/dragonfly/InShot_20260212_153903491.jpg"];
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
      `Minimal 3D-printed slip-ons with a flexible lattice sole. $${SLIP_ONS_PRICE_CENTS / 100}.`;
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
    const images = [MAGIKID_SHOES_COVER];
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

  if (slug === STL_FILES_SLUG) {
    const title = `${STL_FILES_NAME} – Voronyz`;
    const description = STL_FILES_DESCRIPTION;
    const images = [STL_FILES_THUMBNAIL_URL, ...STL_FILES_IMAGES];
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
    const images = [...LATTICE_INSOLES_IMAGES];
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


