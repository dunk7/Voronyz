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

test("top hero fills the viewport with clearly crinkled black paper", () => {
  assert.match(home, /hero-paper/);
  assert.match(home, /hero-paper-sheet/);
  assert.match(home, /crinkled-poster\.jpg/);
  const paper = css.match(/\.hero-paper \{[\s\S]*?\n\}/);
  assert.ok(paper, "expected a full-bleed paper stage on the top hero");
  assert.match(paper[0], /background-image:\s*url\("\/graphics\/crinkled-poster\.jpg"\)/);
  assert.match(paper[0], /background-size:\s*cover/);
  const sheet = css.match(/\.hero-paper-sheet \{[\s\S]*?\n\}/);
  assert.ok(sheet, "expected a full-bleed paper sheet on the top hero");
  assert.match(sheet[0], /object-fit:\s*cover/);
  assert.match(home, /max-w-7xl/);
  assert.doesNotMatch(home, /glow-poster-compact/);
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

test("homepage uses solid black without hex; shop pages keep the honeycomb", () => {
  assert.doesNotMatch(home, /HeroVoronoiLattice/);
  assert.doesNotMatch(home, /shop-hex-rail/);
  assert.doesNotMatch(home, /bg-texture-hex/);
  assert.doesNotMatch(home, /bg-texture-white/);
  assert.match(home, /className="bg-black"/);
  assert.match(home, /hero-paper/);
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
  assert.doesNotMatch(css, /\.hero-paper::before \{[\s\S]*?#ff4d6d/);
});

test("homepage V3 Slides clip is not a sticky scroll trap", () => {
  assert.doesNotMatch(home, /data-hero-scrub/);
  assert.doesNotMatch(home, /220vh/);
  assert.doesNotMatch(home, /sticky top-0/);
  assert.match(home, /betweenFootwearAndApparel=\{<HomeSlide \/>\}/);
});
