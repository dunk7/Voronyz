import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyWinterPairToQuantityPricedLines,
  applyWinterPairToStripeLineItems,
  getWinterPairTarget,
  halfOffUnitCents,
  isWinterPairSeason,
} from "./winterPair";

test("season is Nov 8, 2026 through Jan 5, 2027 Pacific", () => {
  // Nov 7 noon PST — still before the window
  assert.equal(isWinterPairSeason(new Date("2026-11-07T20:00:00.000Z")), false);
  // Nov 8 midnight PST — season opens
  assert.equal(isWinterPairSeason(new Date("2026-11-08T08:00:00.000Z")), true);
  assert.equal(isWinterPairSeason(new Date("2026-12-25T18:00:00.000Z")), true);
  // Jan 5 11pm PST — still in season
  assert.equal(isWinterPairSeason(new Date("2027-01-06T07:00:00.000Z")), true);
  // Jan 6 2am PST — season closed
  assert.equal(isWinterPairSeason(new Date("2027-01-06T10:00:00.000Z")), false);
  assert.equal(isWinterPairSeason(new Date("2027-11-10T18:00:00.000Z")), false);
});

test("one extra unit is half off, even when the cart is large", () => {
  assert.equal(halfOffUnitCents(7500), 3750);
  const many = [{ quantity: 50, unitCents: 8000 }];
  const target = getWinterPairTarget(many);
  assert.ok(target);
  assert.equal(target.savingsCents, 4000);
  const lines = applyWinterPairToQuantityPricedLines(many);
  const total = lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
  assert.equal(total, 8000 * 49 + 4000);
});

test("a single unit does not get half off", () => {
  assert.equal(getWinterPairTarget([{ quantity: 1, unitCents: 7500 }]), null);
});

test("the cheaper additional item is the one that is halved", () => {
  const lines = applyWinterPairToQuantityPricedLines([
    { quantity: 1, unitCents: 9000 },
    { quantity: 1, unitCents: 6000 },
  ]);
  assert.equal(lines[0].unitCents, 9000);
  assert.equal(lines[1].unitCents, 3000);
});

test("a free unit is not the half-off unit", () => {
  const lines = [
    { quantity: 1, unitCents: 9000 },
    { quantity: 1, unitCents: 0 },
    { quantity: 1, unitCents: 4000 },
  ];
  const target = getWinterPairTarget(lines);
  assert.equal(target?.index, 2);
  assert.equal(target?.savingsCents, 2000);
});

test("Stripe lines split one half-price unit", () => {
  const lines = [
    {
      quantity: 2,
      price_data: { unit_amount: 7500, product_data: { name: "Slides" } },
    },
  ];
  applyWinterPairToStripeLineItems(lines);
  assert.equal(lines[0].quantity, 1);
  assert.equal(lines[0].price_data?.unit_amount, 7500);
  assert.equal(lines[1].quantity, 1);
  assert.equal(lines[1].price_data?.unit_amount, 3750);
});
