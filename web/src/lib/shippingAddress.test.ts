import assert from "node:assert/strict";
import { test } from "node:test";
import { parseUsFreeformAddress } from "./shippingAddress";

test("parseUsFreeformAddress handles comma and spaced US addresses", () => {
  assert.deepEqual(parseUsFreeformAddress("5223 Farmville Rd, Farmville, VA 23901"), {
    line1: "5223 Farmville Rd",
    line2: null,
    city: "Farmville",
    state: "VA",
    postal_code: "23901",
    country: "US",
  });

  assert.deepEqual(
    parseUsFreeformAddress("5223 Farmville Rd, Apt 2, Farmville, VA, 23901-5937"),
    {
      line1: "5223 Farmville Rd",
      line2: "Apt 2",
      city: "Farmville",
      state: "VA",
      postal_code: "23901-5937",
      country: "US",
    }
  );

  assert.deepEqual(parseUsFreeformAddress("5223 Farmville Rd Farmville VA 23901"), {
    line1: "5223 Farmville Rd",
    line2: null,
    city: "Farmville",
    state: "VA",
    postal_code: "23901",
    country: "US",
  });
});

test("parseUsFreeformAddress rejects incomplete or empty text", () => {
  assert.equal(parseUsFreeformAddress(""), null);
  assert.equal(parseUsFreeformAddress("Farmville Rd"), null);
  assert.equal(parseUsFreeformAddress("5223 Farmville Rd"), null);
  assert.equal(parseUsFreeformAddress("5223 Farmville Rd, Farmville"), null);
});
