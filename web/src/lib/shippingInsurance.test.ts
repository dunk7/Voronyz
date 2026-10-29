import assert from "node:assert/strict";
import { test } from "node:test";
import { STL_FILES_SLUG } from "./stlFiles";
import {
  cartHasInsurableItems,
  cartNeedsShippingAddress,
  isInsurableCartItem,
} from "./shippingInsurance";

test("digital STL carts skip shipping and insurance", () => {
  const stl = { productSlug: STL_FILES_SLUG, quantity: 1 };
  assert.equal(isInsurableCartItem(stl), false);
  assert.equal(cartHasInsurableItems([stl]), false);
  assert.equal(cartNeedsShippingAddress([stl]), false);
});

test("filament still needs a shipping address", () => {
  const filament = { productSlug: "tpu-90a-filament", quantity: 1 };
  assert.equal(cartNeedsShippingAddress([filament]), true);
  assert.equal(cartHasInsurableItems([filament]), true);
});

test("mixed filament + STL still ships the spool", () => {
  const items = [
    { productSlug: STL_FILES_SLUG, quantity: 1 },
    { productSlug: "tpu-90a-filament", quantity: 1 },
  ];
  assert.equal(cartNeedsShippingAddress(items), true);
});
