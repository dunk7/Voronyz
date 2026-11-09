import assert from "node:assert/strict";
import test from "node:test";
import { isHealthSlug } from "@/lib/productCategories";
import {
  PEPPERMINT_MIST_DESCRIPTION,
  PEPPERMINT_MIST_DESCRIPTION_SHORT,
  PEPPERMINT_MIST_NAME,
  PEPPERMINT_MIST_PRICE_CENTS,
  PEPPERMINT_MIST_SLUG,
  PEPPERMINT_MIST_VARIANTS,
  peppermintMistCatalogProduct,
  peppermintMistHealthCatalogSeed,
} from "@/lib/aineFernPeppermintMist";
import { getHealthCatalogSeed } from "@/lib/trailMix";

test("peppermint mist is a $20 Collaborative listing", () => {
  assert.equal(PEPPERMINT_MIST_PRICE_CENTS, 2000);
  assert.equal(PEPPERMINT_MIST_NAME, "Peppermint Freshening Mist");
  assert.ok(isHealthSlug(PEPPERMINT_MIST_SLUG));
  assert.equal(PEPPERMINT_MIST_VARIANTS.length, 1);
  assert.equal(PEPPERMINT_MIST_VARIANTS[0]?.sku, "AF-PFM");
});

test("peppermint mist copy stays cosmetic-only", () => {
  const blob = `${PEPPERMINT_MIST_DESCRIPTION_SHORT}\n${PEPPERMINT_MIST_DESCRIPTION}`.toLowerCase();
  assert.match(blob, /freshen/);
  assert.match(blob, /shoes/);
  assert.match(blob, /not a sanitizer/);
  assert.match(blob, /not a .*disinfectant/);
  assert.doesNotMatch(blob, /\bantifungal\b/);
  assert.doesNotMatch(blob, /kills (germs|bacteria|fungus)/);
  assert.doesNotMatch(blob, /treats? (athlete.?s foot|fungal|fungus)/);
  assert.match(blob, /not intended to diagnose, treat, cure, or prevent/);
});

test("peppermint mist appears in Collaborative catalog seed", () => {
  const seed = getHealthCatalogSeed();
  assert.ok(seed.some((p) => p.slug === PEPPERMINT_MIST_SLUG));
  const catalog = peppermintMistCatalogProduct();
  assert.equal(catalog.priceCents, 2000);
  assert.equal(peppermintMistHealthCatalogSeed().slug, PEPPERMINT_MIST_SLUG);
});
