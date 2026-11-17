/**
 * Lifestyle / model photography for brand surfaces.
 * About uses the workshop/slides-on-the-floor frame; Why it feels different
 * uses a horizontal chest-to-slides crop of the redhead boat shot.
 */
export type LifestyleShot = {
  id: string;
  src: string;
  alt: string;
  /** Product this shot primarily features */
  productSlug?: string;
  aspect: "portrait" | "tall-portrait" | "landscape" | "circle";
};

/** Behind-the-scenes About photo — rows of slides on the floor by the printers. */
export const ABOUT_WORKSHOP_SHOT: LifestyleShot = {
  id: "about-workshop-349",
  src: "/349.jpg",
  alt: "Voronyz workshop with rows of V3 Slides on the floor beside 3D printers",
  productSlug: "v3-slides",
  aspect: "portrait",
};

/** Full redhead boat portrait — gallery / general use. */
export const V3_SLIDES_REDHEAD_BOAT_SHOT: LifestyleShot = {
  id: "v3-slides-redhead-boat",
  src: "/gallery/voronyz-02.jpg",
  alt: "Redhead kid on a boat holding up a pair of Voronyz V3 Slides",
  productSlug: "v3-slides",
  aspect: "portrait",
};

/**
 * Education-band crop: horizontal rectangle from mid-chest up to the tops
 * of the held slides (sky and lower body removed).
 */
export const V3_SLIDES_REDHEAD_CHEST_SHOT: LifestyleShot = {
  id: "v3-slides-redhead-chest",
  src: "/lifestyle/v3-slides-redhead-chest.jpg",
  alt: "Redhead kid holding up a pair of Voronyz V3 Slides",
  productSlug: "v3-slides",
  aspect: "landscape",
};

export const HOME_LIFESTYLE_SHOTS: LifestyleShot[] = [V3_SLIDES_REDHEAD_BOAT_SHOT];

export function lifestyleForProduct(slug: string): LifestyleShot[] {
  const key = slug.trim().toLowerCase();
  return HOME_LIFESTYLE_SHOTS.filter((shot) => shot.productSlug === key);
}
