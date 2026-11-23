import assert from "node:assert/strict";
import { test } from "node:test";
import {
  UspsAddressError,
  verifyUsAddressWithUsps,
} from "./uspsAddressVerify";

const farmville = {
  line1: "5223 Farmville Rd",
  line2: null,
  city: "Farmville",
  state: "VA",
  postal_code: "23901",
};

const fake = {
  line1: "99999 Fake Nowhere Blvd",
  line2: null,
  city: "Farmville",
  state: "VA",
  postal_code: "23901",
};

test("Census/USPS-style verifier accepts 5223 Farmville Rd and rejects a made-up street", async () => {
  // No USPS/Google credentials in CI — Census address-range geocoder is the
  // free last resort and still rejects addresses USPS wouldn't deliver to.
  const good = await verifyUsAddressWithUsps(farmville);
  assert.equal(good.country, "US");
  assert.match(good.line1.toUpperCase(), /5223\s+FARMVILLE\s+RD/);
  assert.equal(good.city.toUpperCase(), "FARMVILLE");
  assert.equal(good.state, "VA");
  assert.match(good.postal_code, /^23901(-\d{4})?$/);
  assert.ok(good.source === "census" || good.source === "google_usps" || good.source === "usps");

  await assert.rejects(
    () => verifyUsAddressWithUsps(fake),
    (error: unknown) => {
      assert.ok(error instanceof UspsAddressError);
      assert.equal(error.status, 422);
      assert.match(error.message, /USPS does not recognize/i);
      return true;
    }
  );
});

test("Google USPS CASS response is preferred and keeps ZIP+4", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("addressvalidation.googleapis.com")) {
      return new Response(
        JSON.stringify({
          result: {
            uspsData: {
              dpvConfirmation: "Y",
              standardizedAddress: {
                firstAddressLine: "5223 FARMVILLE RD",
                city: "FARMVILLE",
                state: "VA",
                zipCode: "23901",
                zipCodeExtension: "5937",
              },
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    // Avoid hitting real USPS/Census during this unit test.
    return new Response("{}", { status: 500 });
  }) as typeof fetch;

  const prevKey = process.env.GOOGLE_MAPS_API_KEY;
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  delete process.env.USPS_CLIENT_ID;
  delete process.env.USPS_CLIENT_SECRET;

  try {
    const verified = await verifyUsAddressWithUsps(farmville);
    assert.equal(verified.source, "google_usps");
    assert.equal(verified.line1, "5223 FARMVILLE RD");
    assert.equal(verified.postal_code, "23901-5937");
  } finally {
    globalThis.fetch = originalFetch;
    if (prevKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = prevKey;
  }
});

test("DPV N from Google is rejected as unrecognized", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("addressvalidation.googleapis.com")) {
      return new Response(
        JSON.stringify({
          result: {
            uspsData: {
              dpvConfirmation: "N",
              standardizedAddress: {
                firstAddressLine: "99999 FAKE NOWHERE BLVD",
                city: "FARMVILLE",
                state: "VA",
                zipCode: "23901",
              },
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("{}", { status: 500 });
  }) as typeof fetch;

  const prevKey = process.env.GOOGLE_MAPS_API_KEY;
  process.env.GOOGLE_MAPS_API_KEY = "test-key";

  try {
    await assert.rejects(
      () => verifyUsAddressWithUsps(fake),
      (error: unknown) =>
        error instanceof UspsAddressError && /USPS does not recognize/i.test(error.message)
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (prevKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = prevKey;
  }
});
