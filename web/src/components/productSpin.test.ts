import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = join(process.cwd(), "public", "graphics");
const footGlow = readFileSync(
  join(process.cwd(), "src", "components", "FootGlowSection.tsx"),
  "utf8",
);
const productSpin = readFileSync(
  join(process.cwd(), "src", "components", "ProductSpin.tsx"),
  "utf8",
);
const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

test("All Footwear uses the V3 cushion-layer loop, not the sprint canvas", () => {
  assert.match(footGlow, /ProductSpin/);
  assert.doesNotMatch(footGlow, /DragonflySprint/);
  assert.match(footGlow, /paper=\{false\}/);
  assert.match(footGlow, /double density cushion layers side view/);
});

test("cushion layers ship as a smooth white-on-black MP4 with no GIF fallback", () => {
  const mp4 = join(root, "v3-slides-layers-v4.mp4");
  const poster = join(root, "v3-slides-layers-v4-poster.png");
  assert.ok(existsSync(mp4), "expected v3-slides-layers-v4.mp4");
  assert.ok(existsSync(poster), "expected v3-slides-layers-v4-poster.png");
  assert.ok(statSync(mp4).size > 20_000, "MP4 too small");
  assert.equal(existsSync(join(root, "v3-slides-spin.gif")), false);
  assert.equal(existsSync(join(root, "v3-slides-spin.mp4")), false);
  assert.equal(existsSync(join(root, "v3-slides-spin-v2.mp4")), false);
  assert.match(productSpin, /v3-slides-layers-v4\.mp4/);
  assert.doesNotMatch(productSpin, /\.gif/);
  assert.doesNotMatch(productSpin, /spinning 360/);
  assert.match(productSpin, /bg-black/);
  assert.match(productSpin, /no outer Voronyz lattice/);
  assert.match(css, /\.glow-poster-sheet-spin \{[\s\S]*?#000000/);
});

test("old running Dragonfly GIF and sprint module are gone", () => {
  assert.equal(existsSync(join(root, "dragonfly-run.gif")), false);
  assert.equal(existsSync(join(root, "dragonfly-run-v2.gif")), false);
  assert.equal(
    existsSync(join(process.cwd(), "src", "components", "DragonflySprint.tsx")),
    false,
  );
  assert.equal(
    existsSync(join(process.cwd(), "src", "lib", "dragonflySprint.ts")),
    false,
  );
});
