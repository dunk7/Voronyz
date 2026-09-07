import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "globals.css"), "utf8");

const shimmerAfter = css.match(/\.btn-shimmer::after \{[\s\S]*?\n\}/);

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
