export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  /** Optional short caption shown under the photo */
  caption?: string;
};

/**
 * Photo gallery catalog.
 * Sourced from Instagram @voronyz — shown on /gallery unless hidden in admin.
 */
export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "voronyz-01",
    src: "/gallery/voronyz-01.jpg",
    alt: "Person in Voronyz slides beside a teal sports car at dusk",
  },
  {
    id: "voronyz-02",
    src: "/gallery/voronyz-02.jpg",
    alt: "Person on a boat holding up a pair of Voronyz slides",
  },
  {
    id: "voronyz-03",
    src: "/gallery/voronyz-03.jpg",
    alt: "Pair of white Voronyz slip-ons on a black textured surface",
  },
  {
    id: "lifestyle-v3-slides-street",
    src: "/lifestyle/v3-slides-street.jpg",
    alt: "Model wearing black Voronyz V3 Slides on a city street",
  },
  {
    id: "lifestyle-slip-ons-steps",
    src: "/lifestyle/slip-ons-steps.jpg",
    alt: "Model wearing black Voronyz Slip Ons on concrete steps",
  },
  {
    id: "lifestyle-dragonfly-walk",
    src: "/lifestyle/dragonfly-walk.jpg",
    alt: "Model walking in black Voronyz Dragonfly sneakers",
  },
  {
    id: "lifestyle-v3-slides-loft",
    src: "/lifestyle/v3-slides-loft.jpg",
    alt: "Model wearing sage Voronyz V3 Slides in a sunlit loft",
  },
  {
    id: "lifestyle-dragonfly-patio",
    src: "/lifestyle/dragonfly-patio.jpg",
    alt: "Model wearing black Voronyz Dragonfly sneakers on a patio",
  },
  {
    id: "lifestyle-v3-slides-pool",
    src: "/lifestyle/v3-slides-pool.jpg",
    alt: "Close-up of sage Voronyz V3 Slides worn by a pool",
  },
];
