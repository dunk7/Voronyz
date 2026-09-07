import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "globals.css"), "utf8");

const shimmerAfter = css.match(
  /\.btn-shimmer::after \{\n  position:[\s\S]*?\n\}/,
);

test("button shimmer stays a faint overlay and never paints the fill white", () => {
  assert.ok(shimmerAfter, "expected a .btn-shimmer::after overlay rule");
  assert.match(shimmerAfter![0], /rgb\(255 255 255 \/ 0\.1[0-6]\)/);
  assert.doesNotMatch(
    shimmerAfter![0],
    /rgb\(255 255 255 \/ 0\.(?:[2-9]\d?|1[7-9])\)/,
    "shimmer peak should stay barely visible (≤ 0.16)",
  );
  assert.doesNotMatch(
    css.match(/\.btn-shimmer \{[\s\S]*?\n\}/)?.[0] ?? "",
    /background-color:\s*#f5f5f5/i,
    ".btn-shimmer must not force a white chip fill",
  );
});

test("button shimmer is a continuous futuristic loop, not a sweep that parks", () => {
  assert.match(css, /@keyframes btn-shimmer-flow/);
  assert.match(css, /@keyframes btn-shimmer-flow-alt/);
  assert.match(shimmerAfter![0], /linear infinite/);
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
  assert.doesNotMatch(
    css,
    /btn-shimmer-sweep[^{]*\{[^}]*0%,\s*22%/,
    "shimmer must not hold, then stop on the right edge",
  );
});

test("dark mode does not invert shimmer CTAs to white chips", () => {
  assert.doesNotMatch(
    css,
    /html\.site-dark[^{}]*\.btn-shimmer(?!\))[^{]*\{[^}]*background-color:\s*#f5f5f5/i,
    "dark-mode shimmer rules must not force a light fill",
  );
  assert.match(
    css,
    /button\.bg-black:not\(\.btn-shimmer\)/,
    "selected-chip invert should skip primary shimmer CTAs",
  );
});
