/**
 * USPS-style address verification for manual checkout entry.
 *
 * Pirate Ship validates domestic addresses against the USPS database and
 * returns a standardized form (incl. ZIP+4). This module mirrors that:
 *
 * 1. Official USPS Addresses 3.0 API when USPS_CLIENT_ID + USPS_CLIENT_SECRET
 *    are set
 * 2. Google Address Validation API with USPS CASS / DPV when
 *    GOOGLE_MAPS_API_KEY is set (same key family as Places autocomplete)
 * 3. US Census Bureau address ranges geocoder as a free last resort (same
 *    TIGER/USPS address-range data; may omit ZIP+4)
 *
 * Made-up addresses are rejected. Recognized addresses are returned in
 * USPS-standardized form when the provider supplies one.
 */

export class UspsAddressError extends Error {
  constructor(
    message: string,
    readonly status: number = 422
  ) {
    super(message);
  }
}

export type UsAddressInput = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
};

export type StandardizedUsAddress = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: "US";
  /** Which verifier produced the standardized result. */
  source: "usps" | "google_usps" | "census";
};

const UNRECOGNIZED =
  "USPS does not recognize that address. Check the street number, street name, city, state, and ZIP — or pick a suggestion from address lookup.";

function zip5(postal: string): string {
  const digits = postal.replace(/\D/g, "");
  return digits.slice(0, 5);
}

function zipPlus4(postal: string): string {
  const digits = postal.replace(/\D/g, "");
  if (digits.length >= 9) return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  return digits.slice(0, 5);
}

function combineZip(zip: string, plus4?: string | null): string {
  const five = zip5(zip);
  const ext = (plus4 ?? "").replace(/\D/g, "").slice(0, 4);
  if (five.length !== 5) return zip.trim();
  return ext.length === 4 ? `${five}-${ext}` : five;
}

function dpvOk(code: string | null | undefined): boolean {
  // Y = fully confirmed; D = primary confirmed (unit missing); S = primary
  // confirmed (unit present but unconfirmed). N / empty = not deliverable.
  const c = (code ?? "").trim().toUpperCase();
  return c === "Y" || c === "D" || c === "S";
}

/* ------------------------------------------------------------------ */
/*  Official USPS Addresses 3.0                                        */
/* ------------------------------------------------------------------ */

type UspsTokenCache = { token: string; exp: number };
let uspsTokenCache: UspsTokenCache | null = null;

function uspsCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.USPS_CLIENT_ID?.trim();
  const clientSecret = process.env.USPS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function uspsAccessToken(): Promise<string | null> {
  const creds = uspsCredentials();
  if (!creds) return null;
  if (uspsTokenCache && uspsTokenCache.exp > Date.now() + 30_000) {
    return uspsTokenCache.token;
  }

  const res = await fetch("https://apis.usps.com/oauth2/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("USPS OAuth failed:", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) return null;
  uspsTokenCache = {
    token: data.access_token,
    exp: Date.now() + Math.max(60, Number(data.expires_in) || 3600) * 1000,
  };
  return data.access_token;
}

async function verifyWithUspsApi(
  input: UsAddressInput
): Promise<StandardizedUsAddress | null> {
  const token = await uspsAccessToken();
  if (!token) return null;

  const url = new URL("https://apis.usps.com/addresses/v3/address");
  url.searchParams.set("streetAddress", input.line1);
  if (input.line2?.trim()) url.searchParams.set("secondaryAddress", input.line2.trim());
  url.searchParams.set("city", input.city);
  url.searchParams.set("state", input.state);
  const five = zip5(input.postal_code);
  if (five) url.searchParams.set("ZIPCode", five);

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (res.status === 404 || res.status === 400) {
    throw new UspsAddressError(UNRECOGNIZED, 422);
  }
  if (!res.ok) {
    console.error("USPS address API failed:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = (await res.json()) as {
    address?: {
      streetAddress?: string;
      secondaryAddress?: string | null;
      city?: string;
      state?: string;
      ZIPCode?: string;
      ZIPPlus4?: string | null;
    };
    additionalInfo?: { DPVConfirmation?: string };
  };

  const addr = data.address;
  const dpv = data.additionalInfo?.DPVConfirmation;
  if (!addr?.streetAddress || !dpvOk(dpv)) {
    throw new UspsAddressError(UNRECOGNIZED, 422);
  }

  return {
    line1: addr.streetAddress.trim(),
    line2: addr.secondaryAddress?.trim() || null,
    city: (addr.city ?? input.city).trim(),
    state: (addr.state ?? input.state).trim().toUpperCase(),
    postal_code: combineZip(addr.ZIPCode ?? input.postal_code, addr.ZIPPlus4),
    country: "US",
    source: "usps",
  };
}

/* ------------------------------------------------------------------ */
/*  Google Address Validation (USPS CASS / DPV)                        */
/* ------------------------------------------------------------------ */

function googleKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
}

async function verifyWithGoogleUsps(
  input: UsAddressInput
): Promise<StandardizedUsAddress | null> {
  const key = googleKey();
  if (!key) return null;

  const res = await fetch(
    `https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: {
          regionCode: "US",
          locality: input.city,
          administrativeArea: input.state,
          postalCode: zip5(input.postal_code) || undefined,
          addressLines: [input.line1, input.line2?.trim()].filter(Boolean),
        },
        enableUspsCass: true,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    // Key may not have Address Validation enabled — fall through.
    console.error(
      "Google Address Validation failed:",
      res.status,
      await res.text().catch(() => "")
    );
    return null;
  }

  const data = (await res.json()) as {
    result?: {
      verdict?: {
        addressComplete?: boolean;
        hasUnconfirmedComponents?: boolean;
        validationGranularity?: string;
      };
      address?: {
        formattedAddress?: string;
        postalAddress?: {
          addressLines?: string[];
          locality?: string;
          administrativeArea?: string;
          postalCode?: string;
        };
      };
      uspsData?: {
        dpvConfirmation?: string;
        errorMessage?: string;
        standardizedAddress?: {
          firstAddressLine?: string;
          secondAddressLine?: string;
          city?: string;
          state?: string;
          zipCode?: string;
          zipCodeExtension?: string;
        };
      };
    };
  };

  const usps = data.result?.uspsData;
  if (usps?.errorMessage) {
    throw new UspsAddressError(UNRECOGNIZED, 422);
  }

  const dpv = usps?.dpvConfirmation;
  // Explicit USPS DPV failure — same as Pirate Ship rejecting the address.
  if (typeof dpv === "string" && dpv.trim() && !dpvOk(dpv)) {
    throw new UspsAddressError(UNRECOGNIZED, 422);
  }

  const std = usps?.standardizedAddress;
  if (std?.firstAddressLine && dpvOk(dpv)) {
    return {
      line1: std.firstAddressLine.trim(),
      line2: std.secondAddressLine?.trim() || input.line2?.trim() || null,
      city: (std.city ?? input.city).trim(),
      state: (std.state ?? input.state).trim().toUpperCase(),
      postal_code: combineZip(std.zipCode ?? input.postal_code, std.zipCodeExtension),
      country: "US",
      source: "google_usps",
    };
  }

  // Some responses omit uspsData; require a complete postal address with a number.
  const postal = data.result?.address?.postalAddress;
  const line1 = postal?.addressLines?.[0]?.trim() ?? "";
  const complete = data.result?.verdict?.addressComplete;
  if (complete && line1 && /[0-9]/.test(line1) && postal?.locality && postal.administrativeArea) {
    return {
      line1,
      line2: postal.addressLines?.[1]?.trim() || input.line2?.trim() || null,
      city: postal.locality.trim(),
      state: postal.administrativeArea.trim().toUpperCase(),
      postal_code: zipPlus4(postal.postalCode ?? input.postal_code),
      country: "US",
      source: "google_usps",
    };
  }

  throw new UspsAddressError(UNRECOGNIZED, 422);
}

/* ------------------------------------------------------------------ */
/*  US Census Bureau (TIGER / USPS address ranges)                     */
/* ------------------------------------------------------------------ */

async function verifyWithCensus(
  input: UsAddressInput
): Promise<StandardizedUsAddress | null> {
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/locations/address"
  );
  url.searchParams.set("street", input.line1);
  url.searchParams.set("city", input.city);
  url.searchParams.set("state", input.state);
  const five = zip5(input.postal_code);
  if (five) url.searchParams.set("zip", five);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { "User-Agent": "voronyz-checkout-usps-verify/1.0" },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Census geocoder failed:", res.status);
    return null;
  }

  const data = (await res.json()) as {
    result?: {
      addressMatches?: Array<{
        matchedAddress?: string;
        addressComponents?: {
          fromAddress?: string;
          toAddress?: string;
          streetName?: string;
          preType?: string;
          preDirection?: string;
          suffixType?: string;
          suffixDirection?: string;
          city?: string;
          state?: string;
          zip?: string;
        };
      }>;
    };
  };

  const match = data.result?.addressMatches?.[0];
  if (!match?.matchedAddress) {
    throw new UspsAddressError(UNRECOGNIZED, 422);
  }

  // Prefer structured components; fall back to parsing "5223 FARMVILLE RD, FARMVILLE, VA, 23901"
  const components = match.addressComponents;
  let line1 = "";
  let city = input.city;
  let state = input.state;
  let postal = five || input.postal_code;

  if (components?.streetName) {
    const house = input.line1.match(/^\s*(\d+[A-Za-z]?)/)?.[1] ?? "";
    const street = [
      components.preDirection,
      components.preType,
      components.streetName,
      components.suffixType,
      components.suffixDirection,
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    line1 = [house, street].filter(Boolean).join(" ").trim();
    city = components.city?.trim() || city;
    state = components.state?.trim().toUpperCase() || state;
    postal = components.zip?.trim() || postal;
  }

  if (!line1) {
    const parts = match.matchedAddress.split(",").map((p) => p.trim());
    line1 = parts[0] ?? "";
    city = parts[1] ?? city;
    const region = parts[2] ?? "";
    const regionParts = region.split(/\s+/);
    if (regionParts.length >= 1) state = regionParts[0].toUpperCase();
    if (regionParts.length >= 2) postal = regionParts[1];
    if (parts[3]) postal = parts[3];
  }

  if (!line1 || !/[0-9]/.test(line1)) {
    throw new UspsAddressError(UNRECOGNIZED, 422);
  }

  return {
    line1: line1.toUpperCase(),
    line2: input.line2?.trim() || null,
    city: city.toUpperCase(),
    state: state.toUpperCase(),
    postal_code: zipPlus4(postal),
    country: "US",
    source: "census",
  };
}

/* ------------------------------------------------------------------ */
/*  Public                                                             */
/* ------------------------------------------------------------------ */

/**
 * Validate a US address the way Pirate Ship / USPS would: reject unknowns,
 * return the standardized deliverable form when recognized.
 */
export async function verifyUsAddressWithUsps(
  input: UsAddressInput
): Promise<StandardizedUsAddress> {
  const normalized: UsAddressInput = {
    line1: input.line1.trim(),
    line2: input.line2?.trim() || null,
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    postal_code: input.postal_code.trim(),
  };

  // Prefer official USPS, then Google's USPS CASS feed, then Census ranges.
  const providers: Array<() => Promise<StandardizedUsAddress | null>> = [
    () => verifyWithUspsApi(normalized),
    () => verifyWithGoogleUsps(normalized),
    () => verifyWithCensus(normalized),
  ];

  let lastError: unknown = null;
  for (const run of providers) {
    try {
      const result = await run();
      if (result) return result;
    } catch (error) {
      if (error instanceof UspsAddressError && error.status === 422) {
        throw error;
      }
      lastError = error;
    }
  }

  if (lastError) {
    console.error("USPS-style address verification failed:", lastError);
  }
  throw new UspsAddressError(
    "Address verification is unavailable right now. Try again, or pick a suggestion from address lookup.",
    503
  );
}
