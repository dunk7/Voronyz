export const VIOLETTE_PONYBEAD_SLUG = "keychain";
export const VIOLETTE_PONYBEAD_LEGACY_SLUG = "violette-ponybead-animals";
export const VIOLETTE_PONYBEAD_NAME = "Keychain";
export const VIOLETTE_PONYBEAD_PRICE_CENTS = 1000; // $10 per animal
export const VIOLETTE_PONYBEAD_THUMBNAIL_URL =
  "/products/violette-ponybead-animals/violette-ponybead-animals.jpg";

export const VIOLETTE_PONYBEAD_DESCRIPTION_SHORT =
  "Handmade pony bead animal keychains — raccoon, chipmunk, skunk, and fox. $10 each.";

export const VIOLETTE_PONYBEAD_DESCRIPTION =
  "Handmade keychain critters woven from classic pony beads with a silver lobster clasp. Pick your animal: raccoon, chipmunk, skunk, or fox. $10 per animal.";

export const VIOLETTE_PONYBEAD_HOW_ITS_MADE =
  "Each keychain is hand-woven from plastic pony beads on clear cord in a flat lizard-shaped silhouette — triangular head, elongated body, four splayed legs, and a tapering tail — finished with a silver lobster clasp at the nose. Choose raccoon, chipmunk, skunk, or fox; every animal is $10.";

export function isViolettePonybeadSlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  return key === VIOLETTE_PONYBEAD_SLUG || key === VIOLETTE_PONYBEAD_LEGACY_SLUG;
}

export const VIOLETTE_PONYBEAD_IMAGES = [VIOLETTE_PONYBEAD_THUMBNAIL_URL] as const;

export type VioletteAnimalId = "raccoon" | "chipmunk" | "skunk" | "fox";

export type VioletteAnimal = {
  id: VioletteAnimalId;
  label: string;
  description: string;
};

export const VIOLETTE_PONYBEAD_ANIMALS: VioletteAnimal[] = [
  {
    id: "raccoon",
    label: "Raccoon",
    description: "Gray body with a classic black-and-white mask and striped tail",
  },
  {
    id: "chipmunk",
    label: "Chipmunk",
    description: "Caramel tan with a white stripe down the head and back",
  },
  {
    id: "skunk",
    label: "Skunk",
    description: "Black body with a white stripe from head to tail tip",
  },
  {
    id: "fox",
    label: "Fox",
    description: "Bright orange with a white muzzle and white-tipped tail",
  },
];

export const VIOLETTE_PONYBEAD_ANIMAL_IDS = VIOLETTE_PONYBEAD_ANIMALS.map((a) => a.id);

/** No footwear sizes — animals are selected instead. */
export const VIOLETTE_PONYBEAD_SIZES = ["One Size"] as const;

export const VIOLETTE_PONYBEAD_VARIANTS = [
  { color: "raccoon", sku: "VPA-RAC", stock: 999 },
  { color: "chipmunk", sku: "VPA-CHIP", stock: 999 },
  { color: "skunk", sku: "VPA-SKUNK", stock: 999 },
  { color: "fox", sku: "VPA-FOX", stock: 999 },
] as const;

export function violetteAnimalLabel(id: string | null | undefined): string {
  return VIOLETTE_PONYBEAD_ANIMALS.find((a) => a.id === id)?.label ?? id ?? "";
}
