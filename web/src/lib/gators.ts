export const GATORS_SLUG = "gators";
export const GATORS_NAME = "The Gators";
export const GATORS_PRICE_CENTS = 8500; // $85
export const GATORS_THUMBNAIL_URL = "/products/gators/gators.jpg";

export const GATORS_DESCRIPTION_SHORT =
  "Inspired by the alligator — chunky cushion, easy slip-on, ready for all-day wear.";

export const GATORS_DESCRIPTION =
  "Meet The Gators 🐊 — a comfort-first clog with serious bite. Named for the alligator, these easy slip-ons blend a rounded closed toe, open back, and a thick cushioned platform so every step feels soft and supported. Clogs are built for all-day wear: slide them on, stay comfortable, and go. The Gators take that classic clog comfort and give it a gator attitude — grippy sole energy, a breathable mesh upper, and a silhouette that looks as bold as it feels. Limited run — new listing, low stock.";

export const GATORS_HOW_ITS_MADE =
  "Each pair of The Gators is 3D-printed as a one-piece comfort clog: a flexible mesh upper for breathability and a thick, ribbed midsole for cushion and grip. The open-back clog shape makes them easy on and easy off, while the closed toe keeps you covered. Printed to order in your color — black, pink, grey, or skin-tone tan — then finished for daily wear.";

export const GATORS_IMAGES = [GATORS_THUMBNAIL_URL] as const;

export const GATORS_PRIMARY_COLORS = ["black", "pink", "grey", "tan"] as const;

export const GATORS_SIZES = ["5", "6", "7", "8", "9", "10", "11", "12"] as const;

/** Low stock across the new listing — limited pairs available. */
export const GATORS_VARIANTS = [
  { color: "black", sku: "GT-BLK", stock: 2 },
  { color: "pink", sku: "GT-PNK", stock: 2 },
  { color: "grey", sku: "GT-GRY", stock: 2 },
  { color: "tan", sku: "GT-TAN", stock: 2 },
] as const;
