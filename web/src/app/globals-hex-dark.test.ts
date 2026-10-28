import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(dir, "globals.css"), "utf8");
const home = readFileSync(join(dir, "page.tsx"), "utf8");
const footer = readFileSync(join(dir, "../components/Footer.tsx"), "utf8");

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
  assert.match(shopMesh[0], /stroke='%23000000'/);
  assert.match(shopMesh[0], /stroke-opacity='0\.08'/);
  assert.doesNotMatch(shopMesh[0], /hero-bg\.jpg/);
  assert.doesNotMatch(shopMesh[0], /animation/);
  assert.doesNotMatch(shopMesh[0], /--hex-shift/);
  assert.doesNotMatch(shopMesh[0], /translate3d/);
  assert.doesNotMatch(css, /HexTextureMotion/);
});

test("homepage keeps hex shop panels without a hero Voronoi lattice", () => {
  assert.doesNotMatch(home, /HeroVoronoiLattice/);
  assert.doesNotMatch(home, /shop-hex-rail/);
  assert.doesNotMatch(home, /bg-texture-hex/);
  assert.match(home, /className="bg-texture-white"/);
  assert.match(footer, /bg-texture-white/);
  assert.doesNotMatch(footer, /bg-texture-hex/);
  assert.doesNotMatch(css, /\.shop-hex-rail/);
  assert.doesNotMatch(css, /\.bg-texture-hex/);
});

test("hero stage has no colorful Voronoi topology behind the GIF", () => {
  assert.doesNotMatch(css, /\.hero-voronoi-lattice/);
  assert.doesNotMatch(css, /hero-lattice-breathe/);
  assert.doesNotMatch(css, /hero-lattice-light/);
  assert.doesNotMatch(css, /#ff4d6d/);
  assert.doesNotMatch(css, /#4cc9f0/);
  const hero = css.match(/\.hero-stage \{[^}]+\}/);
  assert.ok(hero, "expected a homepage hero stage");
  assert.match(hero[0], /background-color:\s*#000/);
  assert.doesNotMatch(hero[0], /background-image/);
});
