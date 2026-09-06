import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isProtectedCatalogDiscountCode,
  omitProtectedCatalogCodes,
} from "./discountCatalogProtect";
import { VALID_DISCOUNT_CODES } from "./discountPricing";

const CATALOG_CREATOR_CODES = [
  "arabella50",
  "aryan50",
  "aryan10",
  "pedro30",
  "andy50",
  "nicole50",
  "maximus27",
  "chud25",
  "emptyaus",
  "fam45",
  "superdeal35",
  "super20",
  "young",
] as const;

test("Arabella, Pedro, Andy, and the other catalog codes stay protected", () => {
  for (const code of CATALOG_CREATOR_CODES) {
    assert.equal(isProtectedCatalogDiscountCode(code), true, code);
  }
  assert.equal(isProtectedCatalogDiscountCode("nediak177"), false);
  assert.equal(isProtectedCatalogDiscountCode("kaiden"), false);
});

test("every hardcoded catalog discount code is protected", () => {
  for (const code of VALID_DISCOUNT_CODES) {
    assert.equal(isProtectedCatalogDiscountCode(code), true, code);
  }
});

test("restoring omits catalog codes from the disabled set and keeps affiliate codes", () => {
  const disabled = omitProtectedCatalogCodes([
    "arabella50",
    "pedro30",
    "andy50",
    "maximus27",
    "emptyaus",
    "aryan10",
    "super20",
    "superdeal35",
    "nediak177",
    "ARABELLA50",
  ]);
  assert.equal(disabled.has("arabella50"), false);
  assert.equal(disabled.has("pedro30"), false);
  assert.equal(disabled.has("andy50"), false);
  assert.equal(disabled.has("nediak177"), true);
  assert.deepEqual(
    [...VALID_DISCOUNT_CODES].filter((code) => disabled.has(code)),
    []
  );
});
