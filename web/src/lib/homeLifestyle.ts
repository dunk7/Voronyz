/**
 * Lifestyle / model photography for the homepage and related brand surfaces.
 * Generated campaign frames of people wearing Voronyz footwear.
 */
export type LifestyleShot = {
  id: string;
  src: string;
  alt: string;
  /** Product this shot primarily features */
  productSlug?: string;
  aspect: "portrait" | "landscape";
};

export const HOME_LIFESTYLE_SHOTS: LifestyleShot[] = [
  {
    id: "v3-slides-street",
    src: "/lifestyle/v3-slides-street.jpg",
    alt: "Model wearing black Voronyz V3 Slides on a city street",
    productSlug: "v3-slides",
    aspect: "portrait",
  },
  {
    id: "slip-ons-steps",
    src: "/lifestyle/slip-ons-steps.jpg",
    alt: "Model wearing black Voronyz Slip Ons on concrete steps",
    productSlug: "slip-ons",
    aspect: "portrait",
  },
  {
    id: "dragonfly-walk",
    src: "/lifestyle/dragonfly-walk.jpg",
    alt: "Model walking in black Voronyz Dragonfly sneakers",
    productSlug: "dragonfly",
    aspect: "portrait",
  },
  {
    id: "v3-slides-loft",
    src: "/lifestyle/v3-slides-loft.jpg",
    alt: "Model wearing sage Voronyz V3 Slides in a sunlit loft",
    productSlug: "v3-slides",
    aspect: "landscape",
  },
  {
    id: "dragonfly-patio",
    src: "/lifestyle/dragonfly-patio.jpg",
    alt: "Model wearing black Voronyz Dragonfly sneakers on a patio",
    productSlug: "dragonfly",
    aspect: "portrait",
  },
  {
    id: "v3-slides-pool",
    src: "/lifestyle/v3-slides-pool.jpg",
    alt: "Close-up of sage Voronyz V3 Slides worn by a pool",
    productSlug: "v3-slides",
    aspect: "landscape",
  },
];

export function lifestyleForProduct(slug: string): LifestyleShot[] {
  const key = slug.trim().toLowerCase();
  return HOME_LIFESTYLE_SHOTS.filter((shot) => shot.productSlug === key);
}
