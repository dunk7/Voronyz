import assert from "node:assert/strict";
import test from "node:test";
import { buildShareCaption } from "./productShare";

test("share caption includes Voronyz, title, description, and link — not price", () => {
  const caption = buildShareCaption({
    productName: "Oversized Tee",
    productDescription: "Soft heavyweight cotton with a roomy street cut.",
    url: "https://voronyz.com/products/voronyz-oversized-tee",
  });

  assert.match(caption, /^Voronyz\nOversized Tee\n/);
  assert.match(caption, /Soft heavyweight cotton/);
  assert.match(caption, /https:\/\/voronyz\.com\/products\/voronyz-oversized-tee$/);
  assert.doesNotMatch(caption, /\$|price|USD|¢/i);
});

test("share caption strips markup and truncates long descriptions", () => {
  const long = `${"Soft lattice foam ".repeat(40)}<b>extra</b>`;
  const caption = buildShareCaption({
    productName: "V3 Slides",
    productDescription: long,
    url: "https://voronyz.com/products/v3-slides",
  });

  assert.doesNotMatch(caption, /<b>|<\/b>/);
  assert.ok(caption.includes("…"));
  assert.ok(caption.length < long.length);
});
