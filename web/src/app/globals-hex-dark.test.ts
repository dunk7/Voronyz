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

test("homepage keeps hex shop panels without a hex/Voronoi seam", () => {
  assert.match(home, /<HeroVoronoiLattice/);
  assert.doesNotMatch(home, /shop-hex-rail/);
  assert.doesNotMatch(home, /bg-texture-hex/);
  assert.match(home, /className="bg-texture-white"/);
  assert.match(footer, /bg-texture-white/);
  assert.doesNotMatch(footer, /bg-texture-hex/);
  assert.doesNotMatch(css, /\.shop-hex-rail/);
  assert.doesNotMatch(css, /\.bg-texture-hex/);
});

test("hero animation lattice uses the rounded Voronoi foam and a CSS glow", () => {
  const wrap = css.match(/\.hero-voronoi-lattice \{[\s\S]*?\n\}/);
  assert.ok(wrap, "expected the Voronoi lattice on the hero stage");
  assert.match(wrap[0], /linear-gradient\(to bottom/);
  assert.doesNotMatch(wrap[0], /radial-gradient\(ellipse/);

  const cells = css.match(/\.hero-voronoi-lattice-cells \{[\s\S]*?\n\}/);
  assert.ok(cells, "expected the hero-bg Voronoi foam filling the hero stage");
  assert.match(cells[0], /hero-bg\.jpg/);
  assert.match(cells[0], /hero-lattice-breathe/);
  assert.match(cells[0], /mask-size:\s*320px auto/);
  assert.match(cells[0], /mask-repeat:\s*repeat/);
  assert.match(cells[0], /mask-mode:\s*luminance/);
  assert.match(cells[0], /#ff4d6d/);
  assert.match(cells[0], /#4cc9f0/);
  assert.doesNotMatch(cells[0], /\bcover\b/);
  assert.doesNotMatch(cells[0], /mix-blend-mode:\s*color/);
  assert.doesNotMatch(css, /\.hero-voronoi-lattice-cells::after/);

  assert.match(css, /hero-lattice-breathe/);
  const glow = css.match(/\.hero-voronoi-lattice-glow \{[\s\S]*?\n\}/);
  assert.ok(glow, "expected a light-up layer on the lattice");
  assert.match(glow[0], /hero-lattice-light/);
  assert.match(glow[0], /255 77 109/);
  assert.match(glow[0], /76 201 240/);
  assert.doesNotMatch(css, /pointermove|mousemove/);
});

test("hero Voronoi lattice fills the stage up to the header", () => {
  const lattice = css.match(/\.hero-voronoi-lattice \{[\s\S]*?\n\}/);
  assert.ok(lattice, "expected a hero Voronoi lattice layer");
  assert.match(lattice[0], /inset:\s*0/);
  assert.match(lattice[0], /linear-gradient\(to bottom/);
  assert.doesNotMatch(lattice[0], /radial-gradient/);
});
