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
    alt: "Sandy beach dunes under a bright cloudy sky",
    caption: "3D printed slides in sand",
  },
  {
    id: "voronyz-02",
    src: "/gallery/voronyz-02.jpg",
    alt: "Lattice footwear meshes open in Blender on a laptop",
    caption: "What's this for?",
  },
  {
    id: "voronyz-03",
    src: "/gallery/voronyz-03.jpg",
    alt: "Pair of white Voronyz slip-ons on a black textured surface",
  },
  {
    id: "voronyz-04",
    src: "/gallery/voronyz-04.jpg",
    alt: "Hand holding a drink can in a white 3D-printed lattice sleeve",
  },
  {
    id: "voronyz-05",
    src: "/gallery/voronyz-05.jpg",
    alt: "Hands presenting a black lattice Voronyz slide over its box",
    caption: "Voronyz footwear available now",
  },
  {
    id: "voronyz-06",
    src: "/gallery/voronyz-06.jpg",
    alt: "Foot mid-step in Voronyz footwear casting a sharp sidewalk shadow",
  },
  {
    id: "voronyz-07",
    src: "/gallery/voronyz-07.jpg",
    alt: "Fresh black 3D-printed slide resting on a printer build plate",
    caption: "Another pair of slides off to NC",
  },
  {
    id: "voronyz-08",
    src: "/gallery/voronyz-08.jpg",
    alt: "Complex white 3D print being removed from a printer chamber",
  },
  {
    id: "voronyz-09",
    src: "/gallery/voronyz-09.jpg",
    alt: "Person inspecting white modular Voronyz Chair topology parts in sunlight",
  },
  {
    id: "voronyz-10",
    src: "/gallery/voronyz-10.jpg",
    alt: "Hands holding a white lattice Voronyz Chair frame against a wall",
  },
];
