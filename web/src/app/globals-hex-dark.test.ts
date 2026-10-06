import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "globals.css"), "utf8");

test("dark mode paints hex panels black and keeps the tiny traces light", () => {
  const darkHex = css.match(/html\.site-dark \.bg-texture-white \{[^}]+\}/);
  assert.ok(darkHex, "expected a dark-mode rule for .bg-texture-white");
  assert.match(darkHex[0], /background-color:\s*#0a0a0a/i);
  assert.doesNotMatch(darkHex[0], /background-color:\s*#ffffff/i);

  const darkTraces = css.match(/html\.site-dark \.bg-texture-white::before \{[\s\S]*?\n\}/);
  assert.ok(darkTraces, "expected inverted hex traces on the dark field");
  assert.match(darkTraces[0], /stroke='%23ffffff'/);
  assert.match(darkTraces[0], /stroke-opacity='0\.34'/);
});

test("homepage hero stage stays black and does not reuse the shop hex tile", () => {
  assert.doesNotMatch(css, /\.hero-stage::before/);
  const hero = css.match(/\.hero-stage \{[^}]+\}/);
  assert.ok(hero, "expected a homepage hero stage");
  assert.match(hero[0], /background-color:\s*#000/);
});

test("shop hex tiles follow the same --hex-shift motion variables", () => {
  const shopMesh = css.match(/\.bg-texture-white::before \{[\s\S]*?\n\}/);
  assert.ok(shopMesh, "expected a hex overlay on shop panels");
  assert.match(shopMesh[0], /--hex-shift-x/);
  assert.match(shopMesh[0], /--hex-shift-y/);
});
