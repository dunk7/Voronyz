import assert from "node:assert/strict";
import { test } from "node:test";
import {
  colorToCss,
  footwearBrandLabel,
  footwearImageRecolor,
  footwearImageTint,
  footwearSwatches,
  formatUsdFromCents,
  isBlackFootwearColor,
  sortFootwearForTab,
} from "./footwearRanking";

const sample = [
  { slug: "v3-slides", priceCents: 7500 },
  { slug: "slip-ons", priceCents: 11000 },
  { slug: "gators", priceCents: 10000 },
  { slug: "dragonfly", priceCents: 16000 },
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
      "voronyz-lattice-insoles",
      "gators",
    ],
  );
});

test("all-time ranks by price descending", () => {
  const ranked = sortFootwearForTab(sample, "all-time");
  assert.equal(ranked[0]?.slug, "dragonfly");
  assert.equal(ranked[1]?.slug, "slip-ons");
  assert.equal(ranked.at(-2)?.slug, "voronyz-lattice-insoles");
  assert.equal(ranked.at(-1)?.slug, "gators");
});

test("new-in reverses catalog order and keeps coming-soon Gators last", () => {
  const ranked = sortFootwearForTab(sample, "new-in");
  assert.equal(ranked[0]?.slug, "voronyz-lattice-insoles");
  assert.equal(ranked.at(-1)?.slug, "gators");
});

test("formats prices and brand labels", () => {
  assert.equal(formatUsdFromCents(17900), "$179.00");
  assert.equal(footwearBrandLabel("dragonfly"), "VORONYZ");
});

test("swatches map named colors to muted TPU CSS", () => {
  assert.ok(footwearSwatches("dragonfly").includes("#007FFF"));
  assert.equal(colorToCss("pink"), "#d67aa0");
  assert.equal(colorToCss("orange"), "#cc763a");
  assert.equal(colorToCss("green"), "#4a7c59");
  assert.equal(colorToCss("#007FFF"), "#007FFF");
});

test("footwear image CSS tint is disabled in favor of real color heroes", () => {
  assert.equal(isBlackFootwearColor("black"), true);
  assert.equal(isBlackFootwearColor("#111111"), true);
  assert.equal(isBlackFootwearColor(undefined), true);
  assert.equal(isBlackFootwearColor("white"), false);
  assert.equal(footwearImageTint("black"), undefined);
  assert.equal(footwearImageTint("white"), undefined);
  assert.equal(footwearImageTint("orange"), undefined);
  assert.equal(footwearImageTint("#007FFF"), undefined);
  assert.deepEqual(footwearImageRecolor("black"), { kind: "none" });
  assert.deepEqual(footwearImageRecolor("white"), { kind: "none" });
  assert.deepEqual(footwearImageRecolor("orange"), { kind: "none" });
});

test("footwear image recolor ignores trail-mix flavor ids", () => {
  assert.deepEqual(footwearImageRecolor("wild-berry"), { kind: "none" });
  assert.deepEqual(footwearImageRecolor("super-protein"), { kind: "none" });
  assert.deepEqual(footwearImageRecolor("chocolate"), { kind: "none" });
  assert.equal(footwearImageTint("wild-berry"), undefined);
});
