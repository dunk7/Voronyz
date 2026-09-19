import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyOneFreeItemToQuantityPricedLines,
  applyOneFreeItemToStripeLineItems,
  getDiscountCodeDescription,
  getDiscountedUnitPriceCents,
  getOneFreeItemLineIndex,
  getOneFreeItemOffCents,
  isOneItemFreeDiscountCode,
  isValidDiscountCode,
  VALID_DISCOUNT_CODES,
} from "./discountPricing";

test("famzero is a live catalog code", () => {
  assert.equal(isValidDiscountCode("FAMZERO"), true);
  assert.equal(isValidDiscountCode("famzero"), true);
  assert.ok((VALID_DISCOUNT_CODES as readonly string[]).includes("famzero"));
  assert.equal(getDiscountCodeDescription("famzero"), "One item completely free");
  assert.equal(isOneItemFreeDiscountCode("famzero"), true);
  assert.equal(isOneItemFreeDiscountCode("fam45"), false);
});

test("famzero does not rewrite every unit price", () => {
  assert.equal(getDiscountedUnitPriceCents(7500, "famzero"), 7500);
  assert.equal(getDiscountedUnitPriceCents(5000, "famzero"), 5000);
});

test("famzero takes one highest-priced unit off the order", () => {
  assert.equal(getOneFreeItemOffCents([7500, 5000, 7500]), 7500);
  assert.equal(getOneFreeItemOffCents([2000, 2000]), 2000);
  assert.equal(getOneFreeItemOffCents([]), 0);
  assert.equal(getOneFreeItemLineIndex([5000, 7500, 7500]), 1);
});

test("qty 1 line becomes free; extra units stay full price", () => {
  const single = applyOneFreeItemToQuantityPricedLines([
    { quantity: 1, unitCents: 7500 },
    { quantity: 1, unitCents: 5000 },
  ]);
  assert.equal(single[0].unitCents, 0);
  assert.equal(single[1].unitCents, 5000);

  const stacked = applyOneFreeItemToQuantityPricedLines([
    { quantity: 3, unitCents: 7500 },
  ]);
  assert.equal(stacked.length, 2);
  assert.equal(stacked[0].quantity, 2);
  assert.equal(stacked[0].unitCents, 7500);
  assert.equal(stacked[1].quantity, 1);
  assert.equal(stacked[1].unitCents, 0);

  const total = stacked.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
  assert.equal(total, 7500 * 2);
});

test("Stripe line items split one free unit and leave insurance-priced lines alone if applied first", () => {
  const lines = [
    {
      quantity: 2,
      price_data: {
        unit_amount: 7500,
        product_data: { name: "Slides" },
      },
    },
  ];
  applyOneFreeItemToStripeLineItems(lines);
  assert.equal(lines[0].quantity, 1);
  assert.equal(lines[0].price_data?.unit_amount, 7500);
  assert.equal(lines[1].quantity, 1);
  assert.equal(lines[1].price_data?.unit_amount, 0);
});
