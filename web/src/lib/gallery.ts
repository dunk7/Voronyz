export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  /** Optional short caption shown under the photo */
  caption?: string;
};

/**
 * Photo gallery catalog.
 * Sourced from Instagram @voronyz — the /gallery page renders them all.
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
];
