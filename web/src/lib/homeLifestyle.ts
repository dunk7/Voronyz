/**
 * Lifestyle / model photography for the homepage and related brand surfaces.
 * Homepage shows the gallery redhead boat frame once, near the bottom.
 */
export type LifestyleShot = {
  id: string;
  src: string;
  alt: string;
  /** Product this shot primarily features */
  productSlug?: string;
  aspect: "portrait" | "landscape";
};

export const V3_SLIDES_STREET_SHOT: LifestyleShot = {
  id: "v3-slides-redhead-boat",
  src: "/gallery/voronyz-02.jpg",
  alt: "Redhead kid on a boat holding up a pair of Voronyz V3 Slides",
  productSlug: "v3-slides",
  aspect: "portrait",
};

export const HOME_LIFESTYLE_SHOTS: LifestyleShot[] = [V3_SLIDES_STREET_SHOT];

export function lifestyleForProduct(slug: string): LifestyleShot[] {
  const key = slug.trim().toLowerCase();
  return HOME_LIFESTYLE_SHOTS.filter((shot) => shot.productSlug === key);
}
