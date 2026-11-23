import assert from "node:assert/strict";
import { test } from "node:test";
import { shippingFromStripeSession } from "./stripeShipping";

test("shippingFromStripeSession prefers verified metadata over empty Stripe shipping", () => {
  const shipping = shippingFromStripeSession({
    collected_information: {
      shipping_details: {
        name: "5223 Farmville Rd, Farmville, VA 23901",
        address: {
          line1: "",
          city: "",
          state: "",
          postal_code: "",
          country: "",
        },
      },
    },
    metadata: {
      shipName: "Alex Rivera",
      shipLine1: "5223 Farmville Rd",
      shipLine2: "",
      shipCity: "Farmville",
      shipState: "VA",
      shipPostal: "23901",
      shipCountry: "US",
    },
  });

  assert.deepEqual(shipping, {
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
});

test("shippingFromStripeSession keeps a real Stripe shipping address when present", () => {
  const shipping = shippingFromStripeSession({
    shipping_details: {
      name: "Alex Rivera",
      address: {
        line1: "100 Main St",
        line2: "Apt 2",
        city: "Austin",
        state: "TX",
        postal_code: "78701",
        country: "US",
      },
    },
    metadata: {
      shipName: "Ignored",
      shipLine1: "Ignored",
      shipCountry: "US",
    },
  });

  assert.equal(shipping?.address?.line1, "100 Main St");
  assert.equal(shipping?.name, "Alex Rivera");
});
