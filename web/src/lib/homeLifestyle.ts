/**
 * Lifestyle / model photography for the homepage and related brand surfaces.
 * Homepage shows the gallery redhead boat frame once, near the bottom.
 * Dragonfly crouch under The Dragonfly's is a square shoe-forward crop.
 */
export type LifestyleShot = {
  id: string;
  src: string;
  alt: string;
  /** Product this shot primarily features */
  productSlug?: string;
  aspect: "portrait" | "tall-portrait" | "square" | "landscape";
  /** Optional CSS object-position (e.g. "center 82%") when object-cover crops */
  objectPosition?: string;
};

export const V3_SLIDES_STREET_SHOT: LifestyleShot = {
  id: "v3-slides-redhead-boat",
  src: "/gallery/voronyz-02.jpg",
  alt: "Redhead kid on a boat holding up a pair of Voronyz V3 Slides",
  productSlug: "v3-slides",
  aspect: "portrait",
};

export const DRAGONFLY_STREET_SHOT: LifestyleShot = {
  id: "dragonfly-street",
  src: "/lifestyle/dragonfly-street.jpg",
  alt: "Grey Voronyz Dragonfly sneakers in a crouch on an asphalt path",
  productSlug: "dragonfly",
  // Perfect square, anchored to the bottom so the face is out and the shoes lead.
  aspect: "square",
  objectPosition: "center bottom",
};

export const HOME_LIFESTYLE_SHOTS: LifestyleShot[] = [
  V3_SLIDES_STREET_SHOT,
  DRAGONFLY_STREET_SHOT,
];

export function lifestyleForProduct(slug: string): LifestyleShot[] {
  const key = slug.trim().toLowerCase();
  return HOME_LIFESTYLE_SHOTS.filter((shot) => shot.productSlug === key);
}
