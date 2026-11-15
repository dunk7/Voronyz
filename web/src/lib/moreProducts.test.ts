import assert from "node:assert/strict";
import { test } from "node:test";
import { FILAMENT_SLUG } from "./filament";
import { LATTICE_INSOLES_SLUG } from "./latticeInsoles";
import { OVERSIZED_TEE_SLUG } from "./complementaryRecommendations";
import { STL_FILES_SLUG } from "./stlFiles";
import { getMoreProducts, moreProductsShopLink } from "./moreProducts";

test("excludes the current product and returns a full strip", () => {
  const recs = getMoreProducts("slip-ons", 8);
  assert.ok(recs.length >= 4);
  assert.ok(recs.every((item) => item.slug !== "slip-ons"));
  assert.equal(new Set(recs.map((item) => item.slug)).size, recs.length);
});

test("prioritizes same-category footwear before cross-sells", () => {
  const recs = getMoreProducts("slip-ons", 8);
  const firstFootwear = recs.find((item) =>
    ["v3-slides", "dragonfly", "magikid-shoes", LATTICE_INSOLES_SLUG, "gators"].includes(
      item.slug
    )
  );
  assert.ok(firstFootwear, "expected other footwear near the top");
  assert.ok(
    recs.some((item) => item.slug === LATTICE_INSOLES_SLUG || item.slug === OVERSIZED_TEE_SLUG),
    "expected complementary add-ons in the strip"
  );
});

test("engineering products link to the Engineering shop", () => {
  assert.deepEqual(moreProductsShopLink(FILAMENT_SLUG), {
    href: "/accessories",
    label: "Shop Engineering",
  });
  assert.deepEqual(moreProductsShopLink(STL_FILES_SLUG), {
    href: "/accessories",
    label: "Shop Engineering",
  });
});

test("apparel accessories link to the accessories hub", () => {
  assert.deepEqual(moreProductsShopLink("voronyz-stickers"), {
    href: "/apparel/accessories",
    label: "Shop accessories",
  });
});

test("empty slug yields no cards", () => {
  assert.deepEqual(getMoreProducts("", 8), []);
  assert.deepEqual(getMoreProducts("slip-ons", 0), []);
});
