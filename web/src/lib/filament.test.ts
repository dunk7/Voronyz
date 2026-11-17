import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogUnitPriceCents } from "./apparel";
import {
  FILAMENT_BULK_PRICE_CENTS,
  FILAMENT_BULK_QTY_THRESHOLD,
  FILAMENT_DEFAULT_COLOR,
  FILAMENT_MATERIAL_90A,
  FILAMENT_MATERIAL_PLA,
  FILAMENT_PINK_PRICE_CENTS,
  FILAMENT_PRICE_CENTS,
  FILAMENT_SLUG,
  FILAMENT_VARIANTS,
  filamentMaterialSoldOut,
  filamentUnitPriceCents,
  filamentVariantColor,
  isFilamentProductSlug,
} from "./filament";

test("tan and pink list at $45; pink matches the shared filament price", () => {
  assert.equal(FILAMENT_PRICE_CENTS, 4500);
  assert.equal(FILAMENT_PINK_PRICE_CENTS, FILAMENT_PRICE_CENTS);
  assert.equal(FILAMENT_BULK_PRICE_CENTS, 3000);
  assert.equal(FILAMENT_BULK_QTY_THRESHOLD, 10);
});

test("black TPU 90A and PLA are sold out; tan and pink stay in stock", () => {
  const black = FILAMENT_VARIANTS.find(
    (v) => v.color === filamentVariantColor(FILAMENT_MATERIAL_90A, "black"),
  );
  const tan = FILAMENT_VARIANTS.find(
    (v) => v.color === filamentVariantColor(FILAMENT_MATERIAL_90A, "tan"),
  );
  const pink = FILAMENT_VARIANTS.find(
    (v) => v.color === filamentVariantColor(FILAMENT_MATERIAL_90A, "pink"),
  );
  const pla = FILAMENT_VARIANTS.find(
    (v) => v.color === filamentVariantColor(FILAMENT_MATERIAL_PLA, "white"),
  );
  assert.ok(black && tan && pink && pla);
  assert.equal(black.stock, 0);
  assert.ok(tan.stock > 0);
  assert.ok(pink.stock > 0);
  assert.equal(pla.stock, 0);
  assert.equal(filamentMaterialSoldOut(FILAMENT_MATERIAL_PLA), true);
  assert.equal(FILAMENT_DEFAULT_COLOR, filamentVariantColor(FILAMENT_MATERIAL_90A, "tan"));
});

test("filament unit price is $45, or $30 when quantity is more than 10", () => {
  assert.equal(filamentUnitPriceCents(1), 4500);
  assert.equal(filamentUnitPriceCents(10), 4500);
  assert.equal(filamentUnitPriceCents(11), 3000);
  assert.equal(filamentUnitPriceCents(25), 3000);
  assert.equal(
    catalogUnitPriceCents({
      productSlug: FILAMENT_SLUG,
      quantity: 3,
      fallbackCents: 9999,
    }),
    4500,
  );
  assert.equal(
    catalogUnitPriceCents({
      productSlug: FILAMENT_SLUG,
      quantity: 12,
      fallbackCents: 9999,
    }),
    3000,
  );
  assert.equal(isFilamentProductSlug(FILAMENT_SLUG), true);
  assert.equal(isFilamentProductSlug("v3-slides"), false);
});
