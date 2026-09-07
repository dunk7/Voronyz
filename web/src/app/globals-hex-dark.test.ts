import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "globals.css"), "utf8");

test("dark mode keeps the hex texture on a white field", () => {
  const darkHex = css.match(/html\.site-dark \.bg-texture-white \{[^}]+\}/);
  assert.ok(darkHex, "expected a dark-mode rule for .bg-texture-white");
  assert.match(darkHex[0], /background-color:\s*#ffffff/i);
  assert.doesNotMatch(
    css,
    /html\.site-dark \.bg-texture-white::before/,
    "dark mode should keep the original black hex strokes, not invert them",
  );
});
