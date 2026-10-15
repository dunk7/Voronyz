import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(dir, "globals.css"), "utf8");
const home = readFileSync(join(dir, "page.tsx"), "utf8");
const footer = readFileSync(join(dir, "../components/Footer.tsx"), "utf8");

test("dark mode paints shop Voronoi panels black", () => {
  const darkShop = css.match(/html\.site-dark \.bg-texture-white \{[^}]+\}/);
  assert.ok(darkShop, "expected a dark-mode rule for .bg-texture-white");
  assert.match(darkShop[0], /background-color:\s*#0a0a0a/i);
  assert.doesNotMatch(darkShop[0], /background-color:\s*#ffffff/i);
});

test("dark mode keeps hex accent traces light on a black field", () => {
  const darkHex = css.match(/html\.site-dark \.bg-texture-hex \{[^}]+\}/);
  assert.ok(darkHex, "expected a dark-mode rule for .bg-texture-hex");
  assert.match(darkHex[0], /background-color:\s*#0a0a0a/i);

  const darkTraces = css.match(/html\.site-dark \.bg-texture-hex::before \{[\s\S]*?\n\}/);
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

test("shop panels use a static Voronoi lattice, not a flashing hex field", () => {
  const shopMesh = css.match(/\.bg-texture-white::before \{[\s\S]*?\n\}/);
  assert.ok(shopMesh, "expected a Voronoi overlay on shop panels");
  assert.match(shopMesh[0], /hero-bg\.jpg/);
  assert.doesNotMatch(shopMesh[0], /animation/);
  assert.doesNotMatch(shopMesh[0], /hero-lattice-breathe/);
  assert.doesNotMatch(shopMesh[0], /--hex-shift/);
  assert.doesNotMatch(shopMesh[0], /translate3d/);
  assert.doesNotMatch(css, /HexTextureMotion/);
});

test("hex honeycomb is reserved for hard seams and stays static", () => {
  const hexMesh = css.match(/\.bg-texture-hex::before \{[\s\S]*?\n\}/);
  assert.ok(hexMesh, "expected a hex overlay for accent seams");
  assert.match(hexMesh[0], /stroke='%23000000'/);
  assert.match(hexMesh[0], /stroke-opacity='0\.14'/);
  assert.doesNotMatch(hexMesh[0], /animation/);
  assert.doesNotMatch(hexMesh[0], /--hex-shift/);
  assert.match(css, /\.shop-hex-rail \{/);
  assert.match(css, /\.shop-hex-rail\.bg-texture-hex::before/);
});

test("homepage sequences flashing Voronoi, a hard hex rail, then static Voronoi", () => {
  assert.match(home, /shop-hex-rail bg-texture-hex/);
  assert.match(home, /className="bg-texture-white"/);
  assert.match(footer, /bg-texture-hex/);
  assert.doesNotMatch(footer, /bg-texture-white/);
});

test("hero animation lattice uses the rounded Voronoi foam and a CSS glow", () => {
  const cells = css.match(/\.hero-voronoi-lattice-cells \{[\s\S]*?\n\}/);
  assert.ok(cells, "expected the hero-bg Voronoi foam behind the shoe animation");
  assert.match(cells[0], /hero-bg\.jpg/);
  assert.match(cells[0], /hero-lattice-breathe/);

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
