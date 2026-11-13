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

test("All Footwear uses the V3 product spin, not the sprint canvas", () => {
  assert.match(footGlow, /ProductSpin/);
  assert.doesNotMatch(footGlow, /DragonflySprint/);
  assert.match(footGlow, /paper=\{false\}/);
  assert.match(footGlow, /V3 Slides 360/);
});

test("spin media ships as GIF and MP4 from the real mesh render", () => {
  const gif = join(root, "v3-slides-spin.gif");
  const mp4 = join(root, "v3-slides-spin.mp4");
  assert.ok(existsSync(gif), "expected v3-slides-spin.gif");
  assert.ok(existsSync(mp4), "expected v3-slides-spin.mp4");
  assert.ok(statSync(gif).size > 50_000, "GIF too small");
  assert.ok(statSync(mp4).size > 50_000, "MP4 too small");
  assert.ok(statSync(gif).size < 3_000_000, "GIF not optimized");
  assert.match(productSpin, /v3-slides-spin\.mp4/);
  assert.match(productSpin, /v3-slides-spin\.gif/);
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
