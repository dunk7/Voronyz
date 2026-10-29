import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyHalloweenPairToQuantityPricedLines,
  applyHalloweenPairToStripeLineItems,
  getHalloweenPairTarget,
  halfOffUnitCents,
  isHalloweenPairSeason,
} from "./halloweenPair";

test("season is late October through November 1, 2026 Pacific", () => {
  assert.equal(isHalloweenPairSeason(new Date("2026-10-29T18:00:00.000Z")), true);
  assert.equal(isHalloweenPairSeason(new Date("2026-10-23T18:00:00.000Z")), false);
  assert.equal(isHalloweenPairSeason(new Date("2026-11-02T04:00:00.000Z")), true);
  assert.equal(isHalloweenPairSeason(new Date("2026-11-02T08:00:00.000Z")), false);
  assert.equal(isHalloweenPairSeason(new Date("2027-10-30T18:00:00.000Z")), false);
});

test("one extra unit is half off, even when the cart is large", () => {
  assert.equal(halfOffUnitCents(7500), 3750);
  const many = [{ quantity: 50, unitCents: 8000 }];
  const target = getHalloweenPairTarget(many);
  assert.ok(target);
  assert.equal(target.savingsCents, 4000);
  const lines = applyHalloweenPairToQuantityPricedLines(many);
  const total = lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
  assert.equal(total, 8000 * 49 + 4000);
});

test("a single unit does not get half off", () => {
  assert.equal(getHalloweenPairTarget([{ quantity: 1, unitCents: 7500 }]), null);
});

test("the cheaper additional item is the one that is halved", () => {
  const lines = applyHalloweenPairToQuantityPricedLines([
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
  const target = getHalloweenPairTarget(lines);
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
  applyHalloweenPairToStripeLineItems(lines);
  assert.equal(lines[0].quantity, 1);
  assert.equal(lines[0].price_data?.unit_amount, 7500);
  assert.equal(lines[1].quantity, 1);
  assert.equal(lines[1].price_data?.unit_amount, 3750);
});
