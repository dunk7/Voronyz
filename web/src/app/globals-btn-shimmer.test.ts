import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "globals.css"), "utf8");

test("primary buttons are solid fills with no chessboard or shimmer overlay", () => {
  assert.doesNotMatch(css, /\.btn-shimmer/, "shimmer class and overlays should be gone");
  assert.doesNotMatch(css, /@keyframes btn-shimmer/, "button sheen keyframes should be gone");
  assert.doesNotMatch(css, /@keyframes btn-print-crawl/, "print-bed crawl should be gone");
  assert.doesNotMatch(
    css,
    /%3Crect width='10' height='10'/,
    "CTA chessboard tiles should not sit on buttons",
  );
});

test("dark mode still inverts primary buttons without a print-bed overlay", () => {
  assert.match(
    css,
    /html\.site-dark main button\.bg-black[\s\S]*?background-color:\s*#f5f5f5/,
    "black CTAs should flip light on the dark shop",
  );
  assert.doesNotMatch(
    css,
    /html\.site-dark[^{]*\.btn-shimmer/,
    "dark-mode must not restyle a shimmer overlay",
  );
});
