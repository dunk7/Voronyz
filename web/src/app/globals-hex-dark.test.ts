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

test("shop hex tiles stay static and are not pointer-driven", () => {
  const shopMesh = css.match(/\.bg-texture-white::before \{[\s\S]*?\n\}/);
  assert.ok(shopMesh, "expected a hex overlay on shop panels");
  assert.doesNotMatch(shopMesh[0], /--hex-shift/);
  assert.doesNotMatch(shopMesh[0], /translate3d/);
  assert.doesNotMatch(css, /HexTextureMotion/);
});

test("hero animation lattice uses the rounded Voronoi foam and a CSS glow", () => {
  const cells = css.match(/\.hero-voronoi-lattice-cells \{[\s\S]*?\n\}/);
  assert.ok(cells, "expected the hero-bg Voronoi foam behind the shoe animation");
  assert.match(cells[0], /hero-bg\.jpg/);

  assert.match(css, /hero-lattice-breathe/);
  const glow = css.match(/\.hero-voronoi-lattice-glow \{[\s\S]*?\n\}/);
  assert.ok(glow, "expected a light-up layer on the lattice");
  assert.match(glow[0], /hero-lattice-light/);
  assert.doesNotMatch(css, /pointermove|mousemove/);
});

test("hero Voronoi lattice extends past the shoe and fades on the edges", () => {
  const lattice = css.match(/\.hero-voronoi-lattice \{[\s\S]*?\n\}/);
  assert.ok(lattice, "expected a hero Voronoi lattice layer");
  assert.match(lattice[0], /top:\s*-/);
  assert.match(lattice[0], /bottom:\s*-/);
  assert.match(lattice[0], /left:\s*-/);
  assert.match(lattice[0], /right:\s*-/);
  assert.match(lattice[0], /radial-gradient/);
  assert.match(lattice[0], /linear-gradient\(to right/);
  assert.match(lattice[0], /mask-composite:\s*intersect/);
});
