/**
 * Lifestyle / model photography for the homepage and related brand surfaces.
 * Only the approved V3 Slides street (car) frame ships on-site.
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
  id: "v3-slides-street",
  src: "/lifestyle/v3-slides-street.jpg",
  alt: "Model wearing black Voronyz V3 Slides on a city street beside a sports car",
  productSlug: "v3-slides",
  aspect: "portrait",
};

export const HOME_LIFESTYLE_SHOTS: LifestyleShot[] = [V3_SLIDES_STREET_SHOT];

export function lifestyleForProduct(slug: string): LifestyleShot[] {
  const key = slug.trim().toLowerCase();
  return HOME_LIFESTYLE_SHOTS.filter((shot) => shot.productSlug === key);
}
