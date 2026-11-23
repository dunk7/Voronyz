/** Shared (client + server) helpers for verified shipping addresses. */

export const INTERNATIONAL_SHIPPING_CENTS = 30000;
export const INTERNATIONAL_SHIPPING_PRODUCT_NAME = "International shipping";
export const INTERNATIONAL_SHIPPING_DESCRIPTION =
  "Flat fee for orders shipped outside the United States.";

export type VerifiedAddress = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  /** ISO 3166-1 alpha-2, upper case. */
  country: string;
};

export type AddressSuggestion = {
  id: string;
  primary: string;
  secondary: string;
  /** Present when the provider already returned a full address with the suggestion. */
  resolved?: { address: VerifiedAddress; token: string };
};

export type VerifiedShipping = {
  address: VerifiedAddress;
  token: string;
};

/** Two-letter US state / territory codes for manual entry selects (client-safe). */
export const US_STATE_OPTIONS: Array<{ code: string; name: string }> = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "PR", name: "Puerto Rico" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "VI", name: "U.S. Virgin Islands" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export function isDomesticCountry(country: string | null | undefined): boolean {
  return (country ?? "").trim().toUpperCase() === "US";
}

export type ParsedUsFreeformAddress = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: "US";
};

const STATE_CODE_SET = new Set(US_STATE_OPTIONS.map((s) => s.code));
const STATE_NAME_TO_CODE = new Map(
  US_STATE_OPTIONS.map((s) => [s.name.toLowerCase(), s.code])
);

function normalizeFreeformState(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (STATE_CODE_SET.has(upper)) return upper;
  return STATE_NAME_TO_CODE.get(trimmed.toLowerCase()) ?? "";
}

/**
 * Parse a single typed US address line into street/city/state/ZIP pieces.
 * Returns null when the text is too incomplete to verify (e.g. street only).
 *
 * Accepts common shapes:
 * - "5223 Farmville Rd, Farmville, VA 23901"
 * - "5223 Farmville Rd, Farmville, VA, 23901"
 * - "5223 Farmville Rd Farmville VA 23901"
 */
export function parseUsFreeformAddress(
  raw: string
): ParsedUsFreeformAddress | null {
  const cleaned = raw.replace(/\s+/g, " ").trim().replace(/,+/g, ",");
  if (!cleaned || !/\d/.test(cleaned)) return null;

  // Prefer comma-separated:
  // street[, apt], city, ST ZIP  OR  street[, apt], city, ST, ZIP
  const commaParts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (commaParts.length >= 3) {
    let state = "";
    let postal_code = "";
    let city = "";
    let streetParts: string[] = [];

    const last = commaParts[commaParts.length - 1];
    const zipOnly = last.match(/^(\d{5}(?:-\d{4})?)$/);
    const regionTogether = last.match(
      /^([A-Za-z]{2}|[A-Za-z .]+)\s+(\d{5}(?:-\d{4})?)$/
    );

    if (zipOnly && commaParts.length >= 4) {
      postal_code = zipOnly[1];
      state = normalizeFreeformState(commaParts[commaParts.length - 2]);
      city = commaParts[commaParts.length - 3];
      streetParts = commaParts.slice(0, commaParts.length - 3);
    } else if (regionTogether) {
      state = normalizeFreeformState(regionTogether[1]);
      postal_code = regionTogether[2];
      city = commaParts[commaParts.length - 2];
      streetParts = commaParts.slice(0, commaParts.length - 2);
    } else {
      return null;
    }

    if (!state || !postal_code || !city || streetParts.length === 0) return null;
    const line1 = streetParts[0];
    const line2 = streetParts.slice(1).join(", ") || null;
    if (!/[0-9]/.test(line1)) return null;
    return { line1, line2, city, state, postal_code, country: "US" };
  }

  // No commas: "5223 Farmville Rd Farmville VA 23901"
  const tail = cleaned.match(/^(.*)\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (!tail) return null;
  const state = normalizeFreeformState(tail[2]);
  if (!state || !STATE_CODE_SET.has(state)) return null;
  const before = tail[1].trim();
  // Split street from city on a common street suffix so "Rd Farmville" works.
  const streetCity = before.match(
    /^(.*\b(?:rd|road|st|street|ave|avenue|blvd|boulevard|dr|drive|ln|lane|ct|court|way|pl|place|ter|terrace|cir|circle|hwy|highway|pkwy|parkway)\.?)\s+([A-Za-z][A-Za-z .'-]+)$/i
  );
  if (!streetCity) return null;
  const line1 = streetCity[1].trim();
  const city = streetCity[2].trim();
  if (!line1 || !city || !/[0-9]/.test(line1)) return null;
  return {
    line1,
    line2: null,
    city,
    state,
    postal_code: tail[3],
    country: "US",
  };
}

/** Flat surcharge for anything shipped outside the US. */
export function internationalShippingCents(
  country: string | null | undefined
): number {
  const normalized = (country ?? "").trim();
  if (!normalized) return 0;
  return isDomesticCountry(normalized) ? 0 : INTERNATIONAL_SHIPPING_CENTS;
}

export function formatAddressLine(address: VerifiedAddress): string {
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  const region = [address.state, address.postal_code].filter(Boolean).join(" ");
  return [street, address.city, region, address.country]
    .filter(Boolean)
    .join(", ");
}

/**
 * True when text looks like a shipping street rather than a person name.
 * Used to keep autofilled/pasted addresses out of the recipient name field.
 */
export function looksLikeStreetAddress(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (parseUsFreeformAddress(trimmed)) return true;
  return /\d/.test(trimmed) && /,/.test(trimmed);
}

const META_PREFIX = "ship";

/** Stripe metadata values are capped at 500 chars, so each field gets its own key. */
export function addressToStripeMetadata(
  address: VerifiedAddress
): Record<string, string> {
  return {
    [`${META_PREFIX}Name`]: address.name.slice(0, 500),
    [`${META_PREFIX}Line1`]: address.line1.slice(0, 500),
    [`${META_PREFIX}Line2`]: (address.line2 ?? "").slice(0, 500),
    [`${META_PREFIX}City`]: address.city.slice(0, 500),
    [`${META_PREFIX}State`]: address.state.slice(0, 500),
    [`${META_PREFIX}Postal`]: address.postal_code.slice(0, 500),
    [`${META_PREFIX}Country`]: address.country.slice(0, 500),
    shipAddressVerified: "true",
  };
}

export type OrderShippingFromMetadata = {
  name: string | null;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
};

export function shippingFromStripeMetadata(
  metadata: Record<string, string | undefined> | null | undefined
): OrderShippingFromMetadata | null {
  if (!metadata) return null;
  const line1 = metadata[`${META_PREFIX}Line1`]?.trim();
  const country = metadata[`${META_PREFIX}Country`]?.trim();
  if (!line1 || !country) return null;
  return {
    name: metadata[`${META_PREFIX}Name`]?.trim() || null,
    address: {
      line1,
      line2: metadata[`${META_PREFIX}Line2`]?.trim() || null,
      city: metadata[`${META_PREFIX}City`]?.trim() ?? "",
      state: metadata[`${META_PREFIX}State`]?.trim() ?? "",
      postal_code: metadata[`${META_PREFIX}Postal`]?.trim() ?? "",
      country,
    },
  };
}
