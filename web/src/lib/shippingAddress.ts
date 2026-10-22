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

export function isDomesticCountry(country: string | null | undefined): boolean {
  return (country ?? "").trim().toUpperCase() === "US";
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
