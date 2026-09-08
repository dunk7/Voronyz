import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "globals.css"), "utf8");

const shimmerBefore = css.match(
  /\.btn-shimmer::before \{\n  position:[\s\S]*?\n\}/,
);
const shimmerAfter = css.match(
  /\.btn-shimmer::after \{\n  position:[\s\S]*?\n\}/,
);

test("button shimmer is an axis-aligned square chessboard, not hex or diamonds", () => {
  assert.ok(shimmerBefore, "expected a .btn-shimmer::before overlay rule");
  assert.match(
    shimmerBefore![0],
    /%3Crect width='10' height='10'/,
    "CTAs must use square rect tiles",
  );
  assert.match(
    shimmerBefore![0],
    /background-size:\s*20px 20px/,
    "print-bed cells should read as blocks on a chip",
  );
  assert.doesNotMatch(
    shimmerBefore![0],
    /45deg/,
    "45° checkers render as diamonds that read as hex",
  );
  assert.doesNotMatch(
    shimmerBefore![0],
    /L55\.98/,
    "button texture must not reuse the page honeycomb path",
  );
  assert.doesNotMatch(
    css.match(/\.btn-shimmer \{[\s\S]*?\n\}/)?.[0] ?? "",
    /background-color:\s*#f5f5f5/i,
    ".btn-shimmer must not force a white chip fill",
  );
});

test("button shimmer is a traveling sheen over the board, not a parked hex pulse", () => {
  assert.ok(shimmerAfter, "expected a .btn-shimmer::after overlay rule");
  assert.match(css, /@keyframes btn-shimmer-sheen/);
  assert.match(css, /@keyframes btn-print-crawl/);
  assert.match(shimmerAfter![0], /linear infinite/);
  assert.match(
    shimmerAfter![0],
    /rgb\(255 255 255 \/ 0\.55\)/,
    "sheen peak should be visible on the print-bed",
  );
  assert.doesNotMatch(
    shimmerAfter![0],
    /mix-blend-mode:\s*overlay/,
    "overlay on black is invisible — use normal blending",
  );
  assert.doesNotMatch(
    shimmerAfter![0],
    /rgb\(255 255 255 \/ 0\.(?:[7-9]\d?|6[5-9])\)/,
    "sheen peak should stay a blade, not a white wash (≥ 0.65 is too much)",
  );
  assert.doesNotMatch(
    css,
    /@keyframes btn-shimmer-hex/,
    "the stationary hex breathe should be gone",
  );
  assert.doesNotMatch(
    css,
    /@keyframes btn-shimmer-flow/,
    "scrolling disco bands should be gone",
  );
  assert.doesNotMatch(
    css,
    /@keyframes btn-shimmer-sweep/,
    "the old edge-parking sweep should be gone",
  );
  assert.doesNotMatch(
    css,
    /@keyframes btn-shimmer-orbit/,
    "an orbiting lobe parks on the right edge — do not use it",
  );
});

test("dark mode inverts primary buttons and keeps a dark square print-bed", () => {
  assert.match(
    css,
    /html\.site-dark main button\.bg-black[\s\S]*?background-color:\s*#f5f5f5/,
    "black CTAs including shimmer should flip light on the dark shop",
  );
  assert.match(
    css,
    /html\.site-dark main \.btn-shimmer::before[\s\S]*?%3Crect width='10' height='10'/,
    "inverted CTAs should keep the square print-bed",
  );
  assert.doesNotMatch(
    css,
    /html\.site-dark[^{]*\.btn-shimmer::before \{[\s\S]*?L55\.98/,
    "dark-mode shimmer must not fall back to the hex path",
  );
  assert.doesNotMatch(
    css,
    /html\.site-dark[^{]*\.btn-shimmer::after \{[\s\S]*?repeating-linear-gradient/,
    "dark-mode shimmer must not use disco stripes",
  );
});
