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

test("button shimmer is a print-bed chessboard, not a miniature hex copy", () => {
  assert.ok(shimmerBefore, "expected a .btn-shimmer::before overlay rule");
  assert.match(
    shimmerBefore![0],
    /linear-gradient\(\s*45deg/,
    "CTAs should use a square chessboard, not hex SVG cells",
  );
  assert.match(
    shimmerBefore![0],
    /background-size:\s*20px 20px/,
    "print-bed cells should read as blocks on a chip",
  );
  assert.doesNotMatch(
    shimmerBefore![0],
    /data:image\/svg\+xml/,
    "button texture must not reuse the page honeycomb SVG",
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
  assert.match(shimmerAfter![0], /linear infinite/);
  assert.match(
    shimmerAfter![0],
    /rgb\(255 255 255 \/ 0\.3\)/,
    "sheen peak should be visible on black CTAs",
  );
  assert.doesNotMatch(
    shimmerAfter![0],
    /rgb\(255 255 255 \/ 0\.(?:[4-9]\d?|3[2-9])\)/,
    "sheen peak should stay a field, not a white wash (≥ 0.32 is too much)",
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

test("dark mode inverts primary buttons and keeps a dark print-bed", () => {
  assert.match(
    css,
    /html\.site-dark main button\.bg-black[\s\S]*?background-color:\s*#f5f5f5/,
    "black CTAs including shimmer should flip light on the dark shop",
  );
  assert.match(
    css,
    /html\.site-dark main \.btn-shimmer::before[\s\S]*?linear-gradient\(\s*45deg/,
    "inverted CTAs should keep the square print-bed",
  );
  assert.doesNotMatch(
    css,
    /html\.site-dark[^{]*\.btn-shimmer::before \{[\s\S]*?data:image\/svg\+xml/,
    "dark-mode shimmer must not fall back to the hex SVG",
  );
  assert.doesNotMatch(
    css,
    /html\.site-dark[^{]*\.btn-shimmer::after \{[\s\S]*?repeating-linear-gradient/,
    "dark-mode shimmer must not use disco stripes",
  );
});
