import assert from "node:assert/strict";
import { test } from "node:test";
import {
  colorToCss,
  footwearBrandLabel,
  footwearSwatches,
  formatUsdFromCents,
  sortFootwearForTab,
} from "./footwearRanking";

const sample = [
  { slug: "v3-slides", priceCents: 7500 },
  { slug: "slip-ons", priceCents: 11000 },
  { slug: "gators", priceCents: 10000 },
  { slug: "dragonfly", priceCents: 16000 },
  { slug: "magikid-shoes", priceCents: 3000 },
  { slug: "voronyz-lattice-insoles", priceCents: 6300 },
];

test("trending keeps catalog order", () => {
  const ranked = sortFootwearForTab(sample, "trending");
  assert.deepEqual(
    ranked.map((p) => p.slug),
    [
      "v3-slides",
      "slip-ons",
      "dragonfly",
      "gators",
      "magikid-shoes",
      "voronyz-lattice-insoles",
    ],
  );
});

test("all-time ranks by price descending", () => {
  const ranked = sortFootwearForTab(sample, "all-time");
  assert.equal(ranked[0]?.slug, "dragonfly");
  assert.equal(ranked[1]?.slug, "slip-ons");
  assert.equal(ranked.at(-1)?.slug, "magikid-shoes");
});

test("new-in reverses catalog order", () => {
  const ranked = sortFootwearForTab(sample, "new-in");
  assert.equal(ranked[0]?.slug, "voronyz-lattice-insoles");
  assert.equal(ranked.at(-1)?.slug, "v3-slides");
});

test("formats prices and brand labels", () => {
  assert.equal(formatUsdFromCents(17900), "$179.00");
  assert.equal(footwearBrandLabel("dragonfly"), "VORONYZ");
  assert.equal(footwearBrandLabel("magikid-shoes"), "MAGIKID");
});

test("swatches map named colors to CSS", () => {
  assert.ok(footwearSwatches("dragonfly").includes("#007FFF"));
  assert.equal(colorToCss("pink"), "#ec4899");
  assert.equal(colorToCss("#007FFF"), "#007FFF");
});
