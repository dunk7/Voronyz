import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isCompleteAddress,
  parseVerifiedShipping,
  signAddress,
  verifyAddressToken,
  verifyAndSignManualAddress,
} from "./addressVerification";
import {
  addressToStripeMetadata,
  INTERNATIONAL_SHIPPING_CENTS,
  internationalShippingCents,
  shippingFromStripeMetadata,
} from "./shippingAddress";

const core = {
  line1: "1600 Pennsylvania Avenue Northwest",
  city: "Washington",
  state: "DC",
  postal_code: "20500",
  country: "US",
};

test("signed address verifies and rejects edits", () => {
  const token = signAddress(core);
  assert.equal(verifyAddressToken(core, token), true);
  assert.equal(verifyAddressToken({ ...core, line1: "1 Fake St" }, token), false);
  assert.equal(verifyAddressToken({ ...core, postal_code: "99999" }, token), false);
  assert.equal(verifyAddressToken(core, `${token}x`), false);
  assert.equal(verifyAddressToken(core, "garbage"), false);
  assert.equal(verifyAddressToken(core, undefined), false);
});

test("US addresses need number, city, state, and zip", () => {
  assert.equal(isCompleteAddress(core), true);
  assert.equal(isCompleteAddress({ ...core, line1: "Pennsylvania Avenue" }), false);
  assert.equal(isCompleteAddress({ ...core, postal_code: "" }), false);
  assert.equal(isCompleteAddress({ ...core, state: "" }), false);
});

test("parseVerifiedShipping requires a signed address and a name", () => {
  const token = signAddress(core);
  const ok = parseVerifiedShipping({
    address: { ...core, name: "Pat", line2: "Apt 4" },
    token,
  });
  assert.equal(ok?.line2, "Apt 4");
  assert.equal(ok?.name, "Pat");

  assert.equal(
    parseVerifiedShipping({ address: { ...core, name: "" }, token }),
    null
  );
  assert.equal(
    parseVerifiedShipping({ address: { ...core, name: "Pat", city: "Nowhere" }, token }),
    null
  );
  assert.equal(parseVerifiedShipping({ address: { ...core, name: "Pat" } }), null);
  assert.equal(parseVerifiedShipping(null), null);
});

test("only non-US destinations pay the international fee", () => {
  assert.equal(internationalShippingCents("US"), 0);
  assert.equal(internationalShippingCents("us"), 0);
  assert.equal(internationalShippingCents("CA"), INTERNATIONAL_SHIPPING_CENTS);
  assert.equal(INTERNATIONAL_SHIPPING_CENTS, 30000);
  assert.equal(internationalShippingCents(""), 0);
});

test("shipping address round-trips through Stripe metadata", () => {
  const meta = addressToStripeMetadata({ ...core, name: "Pat", line2: null });
  assert.deepEqual(shippingFromStripeMetadata(meta), {
    name: "Pat",
    address: { ...core, line2: null },
  });
  assert.equal(shippingFromStripeMetadata({}), null);
});

test("manual Farmville address verifies via USPS-style check and signs", async () => {
  const signed = await verifyAndSignManualAddress({
    line1: "5223 Farmville Rd",
    city: "Farmville",
    state: "VA",
    postal_code: "23901",
    country: "US",
  });
  assert.match(signed.address.line1.toUpperCase(), /5223\s+FARMVILLE\s+RD/);
  assert.equal(signed.address.state, "VA");
  assert.match(signed.address.postal_code, /^23901(-\d{4})?$/);
  assert.equal(verifyAddressToken(signed.address, signed.token), true);

  const parsed = parseVerifiedShipping({
    address: { ...signed.address, name: "Alex" },
    token: signed.token,
  });
  assert.equal(parsed?.name, "Alex");
  assert.equal(parsed?.line1, signed.address.line1);
});

test("one-box freeform Farmville query verifies the same way", async () => {
  const signed = await verifyAndSignManualAddress({
    query: "5223 Farmville Rd, Farmville, VA 23901",
  });
  assert.match(signed.address.line1.toUpperCase(), /5223\s+FARMVILLE\s+RD/);
  assert.equal(signed.address.city.toUpperCase(), "FARMVILLE");
  assert.equal(signed.address.state, "VA");
  assert.match(signed.address.postal_code, /^23901(-\d{4})?$/);
});

test("manual made-up address is rejected by USPS-style check", async () => {
  await assert.rejects(
    () =>
      verifyAndSignManualAddress({
        line1: "99999 Fake Nowhere Blvd",
        city: "Farmville",
        state: "VA",
        postal_code: "23901",
        country: "US",
      }),
    (error: unknown) => {
      assert.ok(error && typeof error === "object" && "status" in error);
      assert.equal((error as { status: number }).status, 422);
      return true;
    }
  );
});
