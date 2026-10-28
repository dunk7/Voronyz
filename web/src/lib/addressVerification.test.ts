import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isCompleteAddress,
  parseVerifiedShipping,
  signAddress,
  verifyAddressToken,
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
