import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatShippingAddress,
  normalizeOrderShipping,
  orderRecipientName,
  shippingFromManualEntry,
} from "./orderTypes";

test("normalizeOrderShipping moves street text out of the name field", () => {
  const normalized = normalizeOrderShipping({
    name: "5223 Farmville Rd, Farmville, VA 23901",
    address: null,
  });
  assert.equal(normalized?.name, null);
  assert.equal(normalized?.address?.line1, "5223 Farmville Rd");
  assert.equal(normalized?.address?.city, "Farmville");
  assert.equal(normalized?.address?.state, "VA");
  assert.equal(normalized?.address?.postal_code, "23901");
});

test("normalizeOrderShipping keeps a real person name with a normal address", () => {
  const normalized = normalizeOrderShipping({
    name: "Alex Rivera",
    address: {
      line1: "5223 Farmville Rd",
      line2: null,
      city: "Farmville",
      state: "VA",
      postal_code: "23901",
      country: "US",
    },
  });
  assert.equal(normalized?.name, "Alex Rivera");
  assert.equal(normalized?.address?.line1, "5223 Farmville Rd");
});

test("orderRecipientName never shows a street as the list name", () => {
  assert.equal(
    orderRecipientName({
      shipping: { name: "5223 Farmville Rd, Farmville, VA 23901", address: null },
      customer: { name: "Alex Rivera" },
    }),
    "Alex Rivera"
  );
  assert.equal(
    orderRecipientName({
      shipping: {
        name: "Alex Rivera",
        address: {
          line1: "5223 Farmville Rd",
          city: "Farmville",
          state: "VA",
          postal_code: "23901",
          country: "US",
        },
      },
    }),
    "Alex Rivera"
  );
});

test("formatShippingAddress recovers address that was stuck in name", () => {
  const text = formatShippingAddress({
    name: "5223 Farmville Rd, Farmville, VA 23901",
    address: null,
  });
  assert.match(text, /5223 Farmville Rd/);
  assert.match(text, /Farmville/);
  assert.doesNotMatch(text, /^5223 Farmville Rd, Farmville, VA 23901$/);
});

test("shippingFromManualEntry accepts freeform paste for the orders page", () => {
  const shipping = shippingFromManualEntry({
    name: "Alex Rivera",
    addressText: "5223 Farmville Rd, Farmville, VA 23901",
  });
  assert.equal(shipping?.name, "Alex Rivera");
  assert.equal(shipping?.address?.line1, "5223 Farmville Rd");
  assert.equal(shipping?.address?.postal_code, "23901");
});
