/**
 * Shared US size charts + owner-facing women's → men's conversion.
 *
 * Customers pick Men's / Women's (and Kids' for footwear). Owners print from
 * men's sizes only, so admin views convert women's orders to the men's
 * equivalent while cart/checkout keep the size the shopper chose.
 */

export const MENS_SHOE_SIZES = ["6", "7", "8", "9", "10", "11", "12", "13"] as const;
export const WOMENS_SHOE_SIZES = ["4", "5", "6", "7", "8", "9", "10", "11"] as const;
export const KIDS_SHOE_SIZES = ["1", "2", "3", "4", "5", "6", "7"] as const;

/** Standard US shoe conversion: Men's = Women's − 1.5 */
export const WOMENS_TO_MENS_SHOE_OFFSET = 1.5;

const APPAREL_LETTER_ORDER = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type SizeGender = "men" | "women" | "kids";

export function shoeSizesForGender(gender: SizeGender): readonly string[] {
  if (gender === "women") return WOMENS_SHOE_SIZES;
  if (gender === "kids") return KIDS_SHOE_SIZES;
  return MENS_SHOE_SIZES;
}

export function parseSizeGender(value: string | null | undefined): SizeGender | null {
  if (value === "men" || value === "women" || value === "kids") return value;
  return null;
}

export function genderDisplayLabel(gender: string | null | undefined): string {
  if (gender === "men") return "Men's";
  if (gender === "women") return "Women's";
  if (gender === "kids") return "Kids'";
  return "";
}

function formatHalfSize(n: number): string {
  if (!Number.isFinite(n)) return "";
  // Prefer whole numbers without trailing .0
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

/** Convert a women's US shoe size to the men's US print size. */
export function womenShoeSizeToMen(size: string | null | undefined): string | null {
  const raw = (size || "").trim();
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  const men = n - WOMENS_TO_MENS_SHOE_OFFSET;
  if (men <= 0) return null;
  return formatHalfSize(men);
}

/**
 * Convert a women's apparel letter size to the men's blank to print.
 * Women's runs about one letter smaller than men's (W M ≈ M S).
 */
export function womenApparelSizeToMen(size: string | null | undefined): string | null {
  const key = (size || "").trim().toUpperCase();
  if (!key) return null;
  const index = APPAREL_LETTER_ORDER.indexOf(
    key as (typeof APPAREL_LETTER_ORDER)[number],
  );
  if (index < 0) return null;
  if (index === 0) return "XS";
  return APPAREL_LETTER_ORDER[index - 1];
}

function looksLikeApparelLetter(size: string): boolean {
  return APPAREL_LETTER_ORDER.includes(
    size.trim().toUpperCase() as (typeof APPAREL_LETTER_ORDER)[number],
  );
}

function looksLikeShoeNumber(size: string): boolean {
  return /^\d+(\.\d+)?$/.test(size.trim());
}

export type OwnerPrintSize = {
  /** Size owners should print / fulfill. */
  printSize: string;
  /** Always men's for converted women's orders; otherwise the ordered gender. */
  printGender: "men" | "women" | "kids" | null;
  /** True when we remapped a women's order onto a men's size. */
  convertedFromWomen: boolean;
  /** Original size the customer ordered (only set when converted). */
  orderedSize?: string;
  orderedGender?: "women";
};

/**
 * Resolve the men's (or original) size for owner/admin printing.
 * Non-women's orders and non-size SKUs pass through unchanged.
 */
export function resolveOwnerPrintSize(args: {
  size?: string | null;
  gender?: string | null;
}): OwnerPrintSize | null {
  const size = (args.size || "").trim();
  if (!size) return null;
  if (size === "OWB" || size === "IWB" || size === "One Size" || size === "1kg" || size === "Download") {
    return { printSize: size, printGender: null, convertedFromWomen: false };
  }

  const gender = parseSizeGender(args.gender);
  if (gender !== "women") {
    return {
      printSize: size,
      printGender: gender,
      convertedFromWomen: false,
    };
  }

  if (looksLikeShoeNumber(size)) {
    const printSize = womenShoeSizeToMen(size);
    if (!printSize) {
      return { printSize: size, printGender: "women", convertedFromWomen: false };
    }
    return {
      printSize,
      printGender: "men",
      convertedFromWomen: true,
      orderedSize: size,
      orderedGender: "women",
    };
  }

  if (looksLikeApparelLetter(size)) {
    const printSize = womenApparelSizeToMen(size);
    if (!printSize) {
      return { printSize: size, printGender: "women", convertedFromWomen: false };
    }
    return {
      printSize,
      printGender: "men",
      convertedFromWomen: true,
      orderedSize: size.toUpperCase(),
      orderedGender: "women",
    };
  }

  return { printSize: size, printGender: "women", convertedFromWomen: false };
}

/**
 * Admin/orders line copy: men's print size first; note the women's order when converted.
 * Example: `Size 6.5 Men's (ordered Women's 8)`
 */
export function formatOwnerSizeDetails(args: {
  size?: string | null;
  gender?: string | null;
}): string | null {
  const resolved = resolveOwnerPrintSize(args);
  if (!resolved) return null;

  if (resolved.printSize === "OWB") return "OWB — Outside the Waistband";
  if (resolved.printSize === "IWB") return "IWB — Inside the Waistband";

  const genderLabel = genderDisplayLabel(resolved.printGender);
  const base = genderLabel
    ? `Size ${resolved.printSize} ${genderLabel}`
    : `Size ${resolved.printSize}`;

  if (resolved.convertedFromWomen && resolved.orderedSize) {
    return `${base} (ordered Women's ${resolved.orderedSize})`;
  }
  return base;
}
