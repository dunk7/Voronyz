export type GalleryPerson =
  | "Ralph Paradomo"
  | "Nicole Page"
  | "Maximus Chapman"
  | "Alex Chapman"
  | "Mike Shea"
  | "Voronyz"
  | "Community";

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  src: string;
  alt: string;
  /** Optional short caption shown under the media */
  caption?: string;
  poster?: string;
  /** Who posted / appears — used for credit line */
  person?: GalleryPerson;
  /** Extra people this piece is featured under (review filters) */
  featured?: GalleryPerson[];
  href?: string;
  /** Highlight in the scroll-scrub reviews strip */
  review?: boolean;
};

/**
 * Photo + review-video gallery catalog (Instagram @voronyz and tagged creators).
 * Add new entries here as more pictures/videos land — the /gallery page renders them all.
 */
export const GALLERY_PEOPLE: GalleryPerson[] = [
  "Ralph Paradomo",
  "Nicole Page",
  "Maximus Chapman",
  "Alex Chapman",
  "Mike Shea",
];

const REVIEWERS: GalleryPerson[] = [
  "Ralph Paradomo",
  "Nicole Page",
  "Mike Shea",
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "dunes",
    type: "image",
    src: "/gallery/dunes.png",
    alt: "Two people standing barefoot on a sand dune at dusk",
    caption: "Dusk on the dunes",
    person: "Voronyz",
  },
  {
    id: "DbtQnbTSiRr",
    type: "video",
    src: "/gallery/reviews/DbtQnbTSiRr.mp4",
    poster: "/gallery/instagram/DbtQnbTSiRr-poster.jpg",
    alt: "3D printed slides worn for months on the beach",
    caption: "Been wearing for 4 months",
    person: "Mike Shea",
    featured: ["Mike Shea", ...REVIEWERS],
    href: "https://www.instagram.com/p/DbtQnbTSiRr/",
    review: true,
  },
  {
    id: "DVcMTNbkXpS",
    type: "video",
    src: "/gallery/reviews/DVcMTNbkXpS.mp4",
    poster: "/gallery/instagram/DVcMTNbkXpS-poster.jpg",
    alt: "Hands-on comfort review of Voronyz V4 slip ons",
    caption: "Super comfortable V4 slip ons",
    person: "Ralph Paradomo",
    featured: ["Ralph Paradomo", ...REVIEWERS],
    href: "https://www.instagram.com/p/DVcMTNbkXpS/",
    review: true,
  },
  {
    id: "DaCY5S9yS_Y",
    type: "video",
    src: "/gallery/reviews/DaCY5S9yS_Y.mp4",
    poster: "/gallery/instagram/DaCY5S9yS_Y-poster.jpg",
    alt: "Flexing Voronyz slides — available now",
    caption: "Comfort in every step",
    person: "Nicole Page",
    featured: ["Nicole Page", "Alex Chapman", ...REVIEWERS],
    href: "https://www.instagram.com/p/DaCY5S9yS_Y/",
    review: true,
  },
  {
    id: "DZ0oayMPMFD",
    type: "video",
    src: "/gallery/reviews/DZ0oayMPMFD.mp4",
    poster: "/gallery/instagram/DZ0oayMPMFD-poster.jpg",
    alt: "Voronyz shoe printing on a Bambu Lab printer",
    caption: "Printing in progress",
    person: "Community",
    featured: REVIEWERS,
    href: "https://www.instagram.com/p/DZ0oayMPMFD/",
    review: true,
  },
  {
    id: "DZijSpMx1oV",
    type: "video",
    src: "/gallery/reviews/DZijSpMx1oV.mp4",
    poster: "/gallery/instagram/DZijSpMx1oV-poster.jpg",
    alt: "Durability check — will they make it to a year",
    caption: "Let's see if they'll make it to a year",
    person: "Maximus Chapman",
    featured: ["Maximus Chapman", ...REVIEWERS],
    href: "https://www.instagram.com/p/DZijSpMx1oV/",
    review: true,
  },
  {
    id: "DYlVPs7xuyp",
    type: "video",
    src: "/gallery/reviews/DYlVPs7xuyp.mp4",
    poster: "/gallery/instagram/DYlVPs7xuyp-poster.jpg",
    alt: "Closet full of Voronyz 3D printed slides",
    caption: "Production scaled to the closet",
    person: "Maximus Chapman",
    featured: ["Maximus Chapman"],
    href: "https://www.instagram.com/p/DYlVPs7xuyp/",
    review: true,
  },
  {
    id: "DWaAkYqDdhc",
    type: "video",
    src: "/gallery/reviews/DWaAkYqDdhc.mp4",
    poster: "/gallery/instagram/DWaAkYqDdhc-poster.jpg",
    alt: "Shipping Voronyz slides out to influencers",
    caption: "Shipping slides to creators",
    person: "Alex Chapman",
    featured: ["Alex Chapman", "Ralph Paradomo", "Nicole Page", "Mike Shea"],
    href: "https://www.instagram.com/p/DWaAkYqDdhc/",
    review: true,
  },
  {
    id: "DZwgG8PSkSb",
    type: "video",
    src: "/gallery/reviews/DZwgG8PSkSb.mp4",
    poster: "/gallery/instagram/DZwgG8PSkSb-poster.jpg",
    alt: "Fresh pair of slides packing out with supports still on",
    caption: "Another pair off to NC",
    person: "Alex Chapman",
    featured: ["Alex Chapman"],
    href: "https://www.instagram.com/p/DZwgG8PSkSb/",
    review: true,
  },
  {
    id: "DZy5g_3RSiv",
    type: "video",
    src: "/gallery/reviews/DZy5g_3RSiv.mp4",
    poster: "/gallery/instagram/DZy5g_3RSiv-poster.jpg",
    alt: "3D printed footwear with style",
    caption: "Footwear with style",
    person: "Voronyz",
    href: "https://www.instagram.com/p/DZy5g_3RSiv/",
    review: true,
  },
  {
    id: "DZlMU5xRVfD",
    type: "video",
    src: "/gallery/reviews/DZlMU5xRVfD.mp4",
    poster: "/gallery/instagram/DZlMU5xRVfD-poster.jpg",
    alt: "One of eight lattice pieces in progress",
    caption: "One of 8 pieces…",
    person: "Voronyz",
    href: "https://www.instagram.com/p/DZlMU5xRVfD/",
    review: true,
  },
  {
    id: "DZjE-grkVij",
    type: "video",
    src: "/gallery/reviews/DZjE-grkVij.mp4",
    poster: "/gallery/instagram/DZjE-grkVij-poster.jpg",
    alt: "Alex and Maximus assembling the modular Voronyz chair",
    caption: "Modular topology chair",
    person: "Alex Chapman",
    featured: ["Alex Chapman", "Maximus Chapman"],
    href: "https://www.instagram.com/p/DZjE-grkVij/",
  },
  {
    id: "DYvRDB-FE-H",
    type: "video",
    src: "/gallery/reviews/DYvRDB-FE-H.mp4",
    poster: "/gallery/instagram/DYvRDB-FE-H-poster.jpg",
    alt: "Alex Chapman Voronyz moment",
    caption: "From Alex",
    person: "Alex Chapman",
    featured: ["Alex Chapman"],
    href: "https://www.instagram.com/p/DYvRDB-FE-H/",
  },
  {
    id: "DaZb5oLjHT5",
    type: "video",
    src: "/gallery/reviews/DaZb5oLjHT5.mp4",
    poster: "/gallery/instagram/DaZb5oLjHT5-poster.jpg",
    alt: "Maximus Chapman — momentum",
    caption: "Momentum is crazy rn",
    person: "Maximus Chapman",
    featured: ["Maximus Chapman"],
    href: "https://www.instagram.com/p/DaZb5oLjHT5/",
  },
  {
    id: "DZ9Q62zFmwS",
    type: "video",
    src: "/gallery/reviews/DZ9Q62zFmwS.mp4",
    poster: "/gallery/instagram/DZ9Q62zFmwS-poster.jpg",
    alt: "Maximus Chapman creative mode",
    caption: "Survival to creative",
    person: "Maximus Chapman",
    featured: ["Maximus Chapman"],
    href: "https://www.instagram.com/p/DZ9Q62zFmwS/",
  },
  {
    id: "Da38De2Rgh3",
    type: "video",
    src: "/gallery/reviews/Da38De2Rgh3.mp4",
    poster: "/gallery/instagram/Da38De2Rgh3-poster.jpg",
    alt: "Archived Voronyz moments",
    caption: "Some old photos",
    person: "Voronyz",
    href: "https://www.instagram.com/p/Da38De2Rgh3/",
  },
  {
    id: "DaL7eRFxGNT",
    type: "video",
    src: "/gallery/reviews/DaL7eRFxGNT.mp4",
    poster: "/gallery/instagram/DaL7eRFxGNT-poster.jpg",
    alt: "Voronyz water bottle and daily carry",
    caption: "Daily carry",
    person: "Voronyz",
    href: "https://www.instagram.com/p/DaL7eRFxGNT/",
  },
  {
    id: "DavSYcoRgg8",
    type: "image",
    src: "/gallery/instagram/DavSYcoRgg8.jpg",
    alt: "Stacks of finished Voronyz pairs ready to ship",
    caption: "10 pairs behind — can't take orders right now",
    person: "Maximus Chapman",
    featured: ["Maximus Chapman"],
    href: "https://www.instagram.com/p/DavSYcoRgg8/",
  },
  {
    id: "DZcIDAJFfDL",
    type: "image",
    src: "/gallery/instagram/DZcIDAJFfDL.jpg",
    alt: "Voronyz Gator Slippers announcement",
    caption: "Gator slippers on the way",
    person: "Alex Chapman",
    featured: ["Alex Chapman"],
    href: "https://www.instagram.com/p/DZcIDAJFfDL/",
  },
  {
    id: "DUpoWg_gPru",
    type: "image",
    src: "/gallery/instagram/DUpoWg_gPru.jpg",
    alt: "Voronyz Dragonfly shoe",
    caption: "Dragonfly shoe",
    person: "Alex Chapman",
    featured: ["Alex Chapman"],
    href: "https://www.instagram.com/p/DUpoWg_gPru/",
  },
  {
    id: "DaG1TECFEgO",
    type: "image",
    src: "/gallery/instagram/DaG1TECFEgO.jpg",
    alt: "Alex Chapman collage ending with Voronyz.com",
    caption: "Heritage → Voronyz.com",
    person: "Alex Chapman",
    featured: ["Alex Chapman"],
    href: "https://www.instagram.com/p/DaG1TECFEgO/",
  },
];

/** @deprecated Prefer GALLERY_ITEMS — kept for anything still importing photos-only. */
export type GalleryPhoto = GalleryItem;

export const GALLERY_PHOTOS: GalleryItem[] = GALLERY_ITEMS.filter(
  (item) => item.type === "image"
);

export function galleryReviews(): GalleryItem[] {
  return GALLERY_ITEMS.filter((item) => item.review || item.type === "video");
}

export function galleryByPerson(person: GalleryPerson | "All"): GalleryItem[] {
  if (person === "All") return GALLERY_ITEMS;
  return GALLERY_ITEMS.filter(
    (item) => item.person === person || item.featured?.includes(person)
  );
}
