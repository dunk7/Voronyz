import { createHmac, timingSafeEqual } from "crypto";
import type { AddressSuggestion, VerifiedAddress } from "@/lib/shippingAddress";

/**
 * Server-side address lookup + signing.
 *
 * Suggestions come from Google Places when GOOGLE_MAPS_API_KEY is set, otherwise
 * from the free Photon (OpenStreetMap) geocoder. Whichever provider resolved the
 * address, the street/city/state/zip/country are signed so /api/checkout can
 * prove the address was picked from a real result and not typed by hand.
 */

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AddressCore = Pick<
  VerifiedAddress,
  "line1" | "city" | "state" | "postal_code" | "country"
>;

export class AddressLookupError extends Error {
  constructor(
    message: string,
    readonly status: number = 502
  ) {
    super(message);
  }
}

function signingSecret(): string {
  const secret =
    process.env.ADDRESS_SIGNING_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new AddressLookupError("Address verification is not configured.", 503);
  }
  return "voronyz-address-dev-secret";
}

function coreOf(address: AddressCore): AddressCore {
  return {
    line1: address.line1.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postal_code: address.postal_code.trim(),
    country: address.country.trim().toUpperCase(),
  };
}

function signPayload(payload: string): string {
  return createHmac("sha256", signingSecret())
    .update(`voronyz-address-v1:${payload}`)
    .digest("base64url");
}

export function signAddress(address: AddressCore): string {
  const payload = Buffer.from(
    JSON.stringify({ a: coreOf(address), exp: Date.now() + TOKEN_TTL_MS })
  ).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifyAddressToken(
  address: AddressCore | null | undefined,
  token: unknown
): boolean {
  if (!address || typeof token !== "string") return false;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return false;

  const expected = signPayload(payload);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      a?: AddressCore;
      exp?: number;
    };
    if (!parsed.a || typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return false;
    }
    const signed = coreOf(parsed.a);
    const claimed = coreOf(address);
    return (
      signed.line1 === claimed.line1 &&
      signed.city === claimed.city &&
      signed.state === claimed.state &&
      signed.postal_code === claimed.postal_code &&
      signed.country === claimed.country
    );
  } catch {
    return false;
  }
}

/** Minimum a result must have to be a deliverable street address. */
export function isCompleteAddress(address: AddressCore): boolean {
  const core = coreOf(address);
  if (!core.line1 || !core.country || !/[0-9]/.test(core.line1)) return false;
  if (core.country === "US") {
    return Boolean(
      core.city && /^[A-Z]{2}$/.test(core.state) && /^\d{5}(-\d{4})?$/.test(core.postal_code)
    );
  }
  return Boolean(core.city);
}

/* ------------------------------------------------------------------ */
/*  Google Places (New)                                                */
/* ------------------------------------------------------------------ */

function googleKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
}

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
};

type GoogleComponent = { longText?: string; shortText?: string; types?: string[] };

async function googleSuggest(
  query: string,
  sessionToken: string | undefined,
  key: string
): Promise<AddressSuggestion[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify({
      input: query,
      includedPrimaryTypes: ["street_address", "premise", "subpremise"],
      ...(sessionToken ? { sessionToken } : {}),
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AddressLookupError("Address lookup is unavailable right now.");
  }
  const data = (await res.json()) as GoogleAutocompleteResponse;
  const out: AddressSuggestion[] = [];
  for (const suggestion of data.suggestions ?? []) {
    const prediction = suggestion.placePrediction;
    if (!prediction?.placeId) continue;
    const full = prediction.text?.text ?? "";
    out.push({
      id: prediction.placeId,
      primary: prediction.structuredFormat?.mainText?.text ?? full,
      secondary: prediction.structuredFormat?.secondaryText?.text ?? "",
    });
  }
  return out;
}

function googleComponent(
  components: GoogleComponent[],
  type: string,
  short = false
): string {
  const match = components.find((c) => c.types?.includes(type));
  return (short ? match?.shortText : match?.longText)?.trim() ?? "";
}

export async function resolveGooglePlace(
  placeId: string,
  sessionToken: string | undefined
): Promise<AddressCore> {
  const key = googleKey();
  if (!key) throw new AddressLookupError("Address lookup is not configured.", 503);

  const url = new URL(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`
  );
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "addressComponents",
    },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) {
    throw new AddressLookupError("That address could not be verified.", 422);
  }
  if (!res.ok) {
    throw new AddressLookupError("Address lookup is unavailable right now.");
  }
  const data = (await res.json()) as { addressComponents?: GoogleComponent[] };
  const components = data.addressComponents ?? [];

  const streetNumber = googleComponent(components, "street_number");
  const route = googleComponent(components, "route");
  const premise = googleComponent(components, "premise");
  const line1 = [streetNumber || premise, route].filter(Boolean).join(" ");
  const city =
    googleComponent(components, "locality") ||
    googleComponent(components, "postal_town") ||
    googleComponent(components, "sublocality_level_1") ||
    googleComponent(components, "sublocality") ||
    googleComponent(components, "administrative_area_level_3");
  const postalCode = [
    googleComponent(components, "postal_code"),
    googleComponent(components, "postal_code_suffix"),
  ]
    .filter(Boolean)
    .join("-");

  return {
    line1,
    city,
    state: googleComponent(components, "administrative_area_level_1", true),
    postal_code: postalCode,
    country: googleComponent(components, "country", true).toUpperCase(),
  };
}

/* ------------------------------------------------------------------ */
/*  Photon (OpenStreetMap) fallback                                    */
/* ------------------------------------------------------------------ */

const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "puerto rico": "PR", guam: "GU", "american samoa": "AS",
  "u.s. virgin islands": "VI", "northern mariana islands": "MP",
};

type PhotonFeature = {
  properties?: {
    osm_type?: string;
    osm_id?: number;
    housenumber?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    county?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
  };
};

function photonToAddress(feature: PhotonFeature): AddressCore | null {
  const p = feature.properties;
  if (!p?.street || !p.housenumber || !p.countrycode) return null;
  const country = p.countrycode.toUpperCase();
  const rawState = p.state?.trim() ?? "";
  const state =
    country === "US"
      ? /^[A-Za-z]{2}$/.test(rawState)
        ? rawState.toUpperCase()
        : US_STATES[rawState.toLowerCase()] ?? ""
      : rawState;
  const address: AddressCore = {
    line1: `${p.housenumber} ${p.street}`.trim(),
    city: p.city || p.town || p.village || p.district || p.county || "",
    state,
    postal_code: p.postcode?.trim() ?? "",
    country,
  };
  return isCompleteAddress(address) ? address : null;
}

async function photonSuggest(query: string): Promise<AddressSuggestion[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");
  url.searchParams.append("osm_tag", "place:house");
  url.searchParams.append("osm_tag", "building");
  url.searchParams.append("osm_tag", "office");
  url.searchParams.append("osm_tag", "amenity");
  url.searchParams.append("osm_tag", "shop");
  url.searchParams.append("osm_tag", "tourism");
  url.searchParams.append("osm_tag", "craft");

  const res = await fetch(url, {
    headers: { "User-Agent": "voronyz-checkout-address/1.0" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AddressLookupError("Address lookup is unavailable right now.");
  }
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];
  for (const feature of data.features ?? []) {
    const core = photonToAddress(feature);
    if (!core) continue;
    const dedupeKey = JSON.stringify(core);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const region = [core.state, core.postal_code].filter(Boolean).join(" ");
    out.push({
      id: `photon:${feature.properties?.osm_type}${feature.properties?.osm_id}`,
      primary: core.line1,
      secondary: [core.city, region, core.country].filter(Boolean).join(", "),
      resolved: {
        address: { ...core, name: "", line2: null },
        token: signAddress(core),
      },
    });
    if (out.length >= 6) break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function suggestAddresses(
  query: string,
  sessionToken?: string
): Promise<AddressSuggestion[]> {
  const key = googleKey();
  return key ? googleSuggest(query, sessionToken, key) : photonSuggest(query);
}

export async function resolveSuggestion(
  id: string,
  sessionToken?: string
): Promise<{ address: AddressCore; token: string }> {
  if (id.startsWith("photon:")) {
    throw new AddressLookupError("That address could not be verified.", 422);
  }
  const address = await resolveGooglePlace(id, sessionToken);
  if (!isCompleteAddress(address)) {
    throw new AddressLookupError(
      "That doesn't look like a complete street address. Pick one that includes a house number.",
      422
    );
  }
  return { address, token: signAddress(address) };
}

/**
 * Validates the `shipping` payload sent by the cart ({ address, token }).
 * Returns null unless the street address matches a token we signed and the
 * recipient name is present.
 */
export function parseVerifiedShipping(raw: unknown): VerifiedAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const { address, token } = raw as { address?: unknown; token?: unknown };
  if (!address || typeof address !== "object") return null;
  const a = address as Record<string, unknown>;
  const text = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  const core: AddressCore = {
    line1: text(a.line1, 200),
    city: text(a.city, 100),
    state: text(a.state, 100),
    postal_code: text(a.postal_code, 20),
    country: text(a.country, 2).toUpperCase(),
  };
  const name = text(a.name, 120);
  if (!name || !isCompleteAddress(core)) return null;
  if (!verifyAddressToken(core, token)) return null;

  return { ...coreOf(core), name, line2: text(a.line2, 100) || null };
}
