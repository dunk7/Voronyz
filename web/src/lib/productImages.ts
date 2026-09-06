export function normalizeProductImages(images: unknown): string[] {
  if (!images) return [];

  // Prisma `Json` can come back as:
  // - string[] (desired)
  // - string (JSON-encoded array, or a single URL/path)
  // - other JSON shapes
  if (Array.isArray(images)) {
    return images.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }

  if (typeof images === "string") {
    const raw = images.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
      }
    } catch {
      // If it's not JSON, treat it as a single image path/url.
    }
    return [raw];
  }

  return [];
}

import { MAGIKID_SHOES_THUMBNAIL_URL } from "@/lib/magikidShoesThumbnail";
import { TRAIL_MIX_THUMBNAIL_URL } from "@/lib/trailMix";
import {
  isViolettePonybeadSlug,
  VIOLETTE_PONYBEAD_THUMBNAIL_URL,
} from "@/lib/violettePonybeadAnimals";
import { GATORS_SLUG, GATORS_THUMBNAIL_URL } from "@/lib/gators";
import { FILAMENT_SLUG, FILAMENT_THUMBNAIL_URL } from "@/lib/filament";
import {
  LATTICE_INSOLES_SLUG,
  LATTICE_INSOLES_THUMBNAIL_URL,
} from "@/lib/latticeInsoles";
import { getApparelItem } from "@/lib/apparel";

/**
 * Studio footwear JPEGs have matching transparent `.webp` cutouts so the
 * product sits on the hex texture instead of a grey studio box.
 * Lifestyle photos, video, and hero renders are left as-is.
 */
const FOOTWEAR_STUDIO_CUTOUT =
  /\/products\/(v3-slides|slip-ons|dragonfly|gators|magikid-shoes|lattice-insoles)\//;

export function studioCutoutSrc(src: string | null | undefined): string {
  if (!src) return "";
  if (src.includes("cloud-slides-boat") || src.includes("side-render-of-both")) return src;
  if (!FOOTWEAR_STUDIO_CUTOUT.test(src)) return src;
  return src.replace(/\.jpe?g$/i, ".webp");
}

export function getProductThumbnail(input: { slug?: string; images?: unknown }): string {
  // Special-case: canonical cover assets for known products
  if (input.slug === "v3-slides") {
    return studioCutoutSrc("/products/v3-slides/InShot_20260212_194352014.jpg");
  }
  if (input.slug === "dragonfly") {
    return studioCutoutSrc("/products/dragonfly/InShot_20260212_153516456.jpg");
  }
  if (input.slug === "slip-ons") {
    return studioCutoutSrc("/products/slip-ons/InShot_20260405_203151152.jpg");
  }
  if (input.slug === "magikid-shoes") return MAGIKID_SHOES_THUMBNAIL_URL;
  if (input.slug === "antioxidant-trail-mix") return TRAIL_MIX_THUMBNAIL_URL;
  if (isViolettePonybeadSlug(input.slug)) return VIOLETTE_PONYBEAD_THUMBNAIL_URL;
  if (input.slug === GATORS_SLUG) return studioCutoutSrc(GATORS_THUMBNAIL_URL);
  if (input.slug === FILAMENT_SLUG) return FILAMENT_THUMBNAIL_URL;
  if (input.slug === LATTICE_INSOLES_SLUG) return studioCutoutSrc(LATTICE_INSOLES_THUMBNAIL_URL);
  const apparel = getApparelItem(input.slug);
  if (apparel) return apparel.image;

  const images = normalizeProductImages(input.images);
  return studioCutoutSrc(images[0] ?? "/products/v3-slides/InShot_20260212_194352014.jpg");
}


