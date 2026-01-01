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

export function correctLegacyProductImagePath(path: string): string {
  // Fix incorrect image paths from database - only for old format paths
  return path === "/v3-front.jpg" ? "/legacy/v3-front.jpg"
    : path === "/v3-side.jpg" ? "/legacy/v3-side.jpg"
    : path === "/v3-top.jpg" ? "/legacy/v3-top.jpg"
    : path === "/v3-detail.jpg" ? "/legacy/v3-detail.jpg"
    : path;
}

export function getProductThumbnail(input: { slug?: string; images?: unknown }): string {
  // Special-case: v3 product has canonical updated cover asset
  if (input.slug === "v3-slides") return "/v3.4/Lumii_20251207_031125508.jpg";

  const images = normalizeProductImages(input.images);
  const rawCover = images[0] ?? "/legacy/v3-front.jpg";
  return correctLegacyProductImagePath(rawCover);
}


