export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  /** Optional short caption shown under the photo */
  caption?: string;
};

/**
 * Photo gallery catalog.
 * Add new entries here as more pictures land — the /gallery page renders them all.
 */
export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "dunes",
    src: "/gallery/dunes.png",
    alt: "Two people standing barefoot on a sand dune at dusk",
  },
];
