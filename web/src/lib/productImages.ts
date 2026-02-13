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

export function getProductThumbnail(input: { slug?: string; images?: unknown }): string {
  // Special-case: canonical cover assets for known products
  if (input.slug === "v3-slides") return "/products/v3-slides/InShot_20260212_194215252.jpg";
  if (input.slug === "dragonfly") return "/products/dragonfly/InShot_20260212_153516456.jpg";

  const images = normalizeProductImages(input.images);
  return images[0] ?? "/products/v3-slides/InShot_20260212_194215252.jpg";
}


