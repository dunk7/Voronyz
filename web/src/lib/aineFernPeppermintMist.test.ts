import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isHealthSlug } from "@/lib/productCategories";
import {
  PEPPERMINT_MIST_DESCRIPTION,
  PEPPERMINT_MIST_DESCRIPTION_SHORT,
  PEPPERMINT_MIST_HOW_ITS_MADE,
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

test("peppermint mist buy-box copy stays short and footwear-friendly", () => {
  assert.ok(PEPPERMINT_MIST_DESCRIPTION.length < 280);
  assert.doesNotMatch(PEPPERMINT_MIST_DESCRIPTION, /\n\n/);
  assert.match(PEPPERMINT_MIST_DESCRIPTION.toLowerCase(), /footwear|shoes/);
  assert.match(PEPPERMINT_MIST_DESCRIPTION.toLowerCase(), /peppermint/);
});

test("peppermint mist copy stays cosmetic-only", () => {
  const blob =
    `${PEPPERMINT_MIST_DESCRIPTION_SHORT}\n${PEPPERMINT_MIST_DESCRIPTION}\n${PEPPERMINT_MIST_HOW_ITS_MADE}`.toLowerCase();
  assert.match(blob, /freshen/);
  assert.match(blob, /footwear|shoes/);
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

test("homepage Collaborative teaser is peppermint mist only", () => {
  const homeSource = readFileSync(
    new URL("../app/products/ProductsContent.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    homeSource,
    /const HOME_COLLABORATIVE_TEASER_SLUGS = \[PEPPERMINT_MIST_SLUG\] as const/,
  );
  assert.match(homeSource, /id="collaborative"/);
  assert.match(homeSource, /home-collaborative-heading/);
  assert.match(homeSource, /key === PEPPERMINT_MIST_SLUG/);
  assert.match(homeSource, /object-contain object-center/);

  const pdpSource = readFileSync(
    new URL("../app/products/[slug]/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(pdpSource, /isPeppermintMist/);
  assert.match(pdpSource, /fit=\{[^}]*isPeppermintMist[^}]*"contain"/);
});
