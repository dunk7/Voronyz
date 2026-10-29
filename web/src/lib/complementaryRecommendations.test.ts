import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ATELIER_HOODIE_SLUG,
  OVERSIZED_TEE_SLUG,
  SLIP_ONS_SLUG,
  getComplementaryRecommendations,
  inferProductSlug,
  purchasedSlugs,
} from "./complementaryRecommendations";
import { FILAMENT_SLUG } from "./filament";
import { LATTICE_INSOLES_SLUG } from "./latticeInsoles";
import { STL_FILES_SLUG } from "./stlFiles";

test("infers catalog slugs from Stripe line names when metadata is missing", () => {
  assert.equal(inferProductSlug({ name: "Slip Ons × 1" }), SLIP_ONS_SLUG);
  assert.equal(
    inferProductSlug({ productName: "Lattice Insoles" }),
    LATTICE_INSOLES_SLUG
  );
  assert.equal(inferProductSlug({ name: "Oversized Tee" }), OVERSIZED_TEE_SLUG);
  assert.equal(inferProductSlug({ productSlug: "dragonfly", name: "ignored" }), "dragonfly");
});

test("footwear without insoles recommends insoles then a tee", () => {
  const recs = getComplementaryRecommendations([{ productSlug: "slip-ons" }]);
  assert.deepEqual(
    recs.map((item) => item.slug),
    [LATTICE_INSOLES_SLUG, OVERSIZED_TEE_SLUG]
  );
  assert.match(recs[0]!.reason, /cushion/i);
});

test("does not recommend a product already in the order", () => {
  const recs = getComplementaryRecommendations([
    { productSlug: "v3-slides" },
    { productSlug: LATTICE_INSOLES_SLUG },
  ]);
  assert.equal(
    recs.some((item) => item.slug === LATTICE_INSOLES_SLUG),
    false
  );
  assert.equal(recs[0]?.slug, OVERSIZED_TEE_SLUG);
});

test("tee purchase recommends the hoodie instead of insoles", () => {
  const recs = getComplementaryRecommendations([{ productSlug: OVERSIZED_TEE_SLUG }]);
  assert.equal(recs[0]?.slug, ATELIER_HOODIE_SLUG);
  assert.equal(
    recs.some((item) => item.slug === LATTICE_INSOLES_SLUG),
    false
  );
});

test("insoles without shoes recommend slip-ons", () => {
  const recs = getComplementaryRecommendations([
    { productSlug: LATTICE_INSOLES_SLUG },
  ]);
  assert.equal(recs.some((item) => item.slug === SLIP_ONS_SLUG), true);
});

test("name-only footwear lines still trigger insole recs", () => {
  const recs = getComplementaryRecommendations([{ name: "The Dragonfly's" }]);
  assert.equal(recs[0]?.slug, LATTICE_INSOLES_SLUG);
  assert.ok(purchasedSlugs([{ name: "The Dragonfly's" }]).has("dragonfly"));
});

test("empty cart has no recommendations", () => {
  assert.deepEqual(getComplementaryRecommendations([]), []);
});

test("STL purchase recommends filament", () => {
  const recs = getComplementaryRecommendations([{ productSlug: STL_FILES_SLUG }]);
  assert.equal(recs[0]?.slug, FILAMENT_SLUG);
});

test("filament purchase recommends the Slip On STL", () => {
  const recs = getComplementaryRecommendations([{ productSlug: FILAMENT_SLUG }]);
  assert.equal(recs[0]?.slug, STL_FILES_SLUG);
});

test("Slip On STL name does not infer the physical slip-ons", () => {
  assert.equal(
    inferProductSlug({ name: "Voronyz Slip On STL" }),
    STL_FILES_SLUG
  );
});
