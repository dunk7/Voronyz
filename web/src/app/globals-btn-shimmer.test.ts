import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "globals.css"), "utf8");

const shimmerAfter = css.match(
  /\.btn-shimmer::after \{[\s\S]*?\n\}/,
);

test("button shimmer is a faint hex chessboard, not a white fill", () => {
  assert.ok(shimmerAfter, "expected a .btn-shimmer::after overlay rule");
  assert.match(
    css,
    /background-size:\s*32px 28px/,
    "button sheen must use a scaled storefront hex tile so cells fit on a CTA",
  );
  assert.match(
    css,
    /data:image\/svg\+xml/,
    "hex chessboard must be an SVG overlay",
  );
  assert.match(css, /fill-opacity='0\.1'/);
  assert.doesNotMatch(
    css.match(/\.btn-shimmer \{[\s\S]*?\n\}/)?.[0] ?? "",
    /background-color:\s*#f5f5f5/i,
    ".btn-shimmer must not force a white chip fill",
  );
});

test("button shimmer is a slow hex breathe, not disco light bands", () => {
  assert.match(css, /@keyframes btn-shimmer-hex/);
  assert.match(css, /16s ease-in-out infinite/);
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
    "an orbiting lobe should be gone",
  );
  assert.doesNotMatch(
    css,
    /repeating-linear-gradient/,
    "diagonal stripe fields read as disco lights",
  );
});

test("dark mode inverts primary buttons to the opposite of the black page", () => {
  assert.match(
    css,
    /html\.site-dark main button\.bg-black[\s\S]*?background-color:\s*#f5f5f5/,
    "black CTAs including shimmer should flip light on the dark shop",
  );
  assert.doesNotMatch(
    css,
    /button\.bg-black:not\(\.btn-shimmer\)/,
    "shimmer CTAs should invert with the other black buttons",
  );
});
