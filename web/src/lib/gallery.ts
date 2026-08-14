export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  /** Optional short caption shown under the photo */
  caption?: string;
  /** Instagram post URL */
  href?: string;
};

/**
 * Photo gallery catalog — Instagram @voronyz and tagged creators.
 * Add new entries here as more pictures land — the /gallery page renders them all.
 */
export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "DavSYcoRgg8",
    src: "/gallery/instagram/DavSYcoRgg8.jpg",
    alt: "Stacks of finished Voronyz pairs ready to ship",
    caption: "10 pairs behind — can't take orders right now",
    href: "https://www.instagram.com/p/DavSYcoRgg8/",
  },
  {
    id: "DZcIDAJFfDL",
    src: "/gallery/instagram/DZcIDAJFfDL.jpg",
    alt: "Voronyz Gator Slippers announcement",
    caption: "Gator slippers on the way",
    href: "https://www.instagram.com/p/DZcIDAJFfDL/",
  },
  {
    id: "DUpoWg_gPru",
    src: "/gallery/instagram/DUpoWg_gPru.jpg",
    alt: "Voronyz Dragonfly shoe",
    caption: "Dragonfly shoe",
    href: "https://www.instagram.com/p/DUpoWg_gPru/",
  },
  {
    id: "DaG1TECFEgO",
    src: "/gallery/instagram/DaG1TECFEgO.jpg",
    alt: "Alex Chapman collage ending with Voronyz.com",
    caption: "Heritage → Voronyz.com",
    href: "https://www.instagram.com/p/DaG1TECFEgO/",
  },
];
