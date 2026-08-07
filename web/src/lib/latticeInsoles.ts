export const LATTICE_INSOLES_SLUG = "voronyz-lattice-insoles";
export const LATTICE_INSOLES_NAME = "Lattice Insoles";
export const LATTICE_INSOLES_PRICE_CENTS = 3200; // $32

export const LATTICE_INSOLES_THUMBNAIL_URL =
  "/products/lattice-insoles/lattice-insoles.jpg";

export const LATTICE_INSOLES_DESCRIPTION_SHORT =
  "3D-printed TPU lattice insoles for cushion, bounce, and all-day support. Free US shipping.";

export const LATTICE_INSOLES_DESCRIPTION =
  "Lattice Insoles — drop-in TPU cushion for the shoes you already wear. A springy lattice midsole print gives bounce underfoot without bulk, so long days feel lighter. Pair them with Voronyz footwear or your everyday sneakers. Free US shipping.";

export const LATTICE_INSOLES_HOW_ITS_MADE =
  "Each pair is FDM-printed in flexible TPU with an open lattice structure tuned for cushion and rebound. We print to order in your color, then finish for a clean drop-in fit. Choose S–XL to match your usual shoe size band.";

export const LATTICE_INSOLES_IMAGES = [LATTICE_INSOLES_THUMBNAIL_URL] as const;

export const LATTICE_INSOLES_PRIMARY_COLORS = ["black", "grey"] as const;

export const LATTICE_INSOLES_SIZES = ["S", "M", "L", "XL"] as const;

export const LATTICE_INSOLES_VARIANTS = [
  { color: "black", sku: "INSL-BLK", stock: 999 },
  { color: "grey", sku: "INSL-GRY", stock: 999 },
] as const;
