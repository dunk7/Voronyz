/**
 * Lifestyle / model photography for the homepage and related brand surfaces.
 * Prefer low-angle, product-forward street frames (car / urban) over studio portraits.
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
    alt: "Model wearing black Voronyz V3 Slides on a city street beside a sports car",
    productSlug: "v3-slides",
    aspect: "portrait",
  },
  {
    id: "slip-ons-street",
    src: "/lifestyle/slip-ons-street.jpg",
    alt: "Model wearing black Voronyz Slip Ons on a city street beside a sports car",
    productSlug: "slip-ons",
    aspect: "portrait",
  },
  {
    id: "dragonfly-street",
    src: "/lifestyle/dragonfly-street.jpg",
    alt: "Model walking in black Voronyz Dragonfly sneakers on a city street",
    productSlug: "dragonfly",
    aspect: "portrait",
  },
  {
    id: "v3-slides-green-street",
    src: "/lifestyle/v3-slides-green-street.jpg",
    alt: "Model wearing sage Voronyz V3 Slides on a city street beside a sports car",
    productSlug: "v3-slides",
    aspect: "landscape",
  },
];

export function lifestyleForProduct(slug: string): LifestyleShot[] {
  const key = slug.trim().toLowerCase();
  return HOME_LIFESTYLE_SHOTS.filter((shot) => shot.productSlug === key);
}
