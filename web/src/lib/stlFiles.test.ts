import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STL_FILES_NAME,
  STL_FILES_PRICE_CENTS,
  STL_FILES_SLUG,
  isDigitalProductSlug,
  orderIncludesStlDownload,
} from "./stlFiles";

test("STL listing is the Voronyz Slip On file at $1", () => {
  assert.equal(STL_FILES_SLUG, "super-high-tech-stl");
  assert.equal(STL_FILES_NAME, "Voronyz Slip On STL");
  assert.equal(STL_FILES_PRICE_CENTS, 100);
  assert.equal(isDigitalProductSlug(STL_FILES_SLUG), true);
  assert.equal(isDigitalProductSlug("slip-ons"), false);
  assert.equal(orderIncludesStlDownload([{ productSlug: STL_FILES_SLUG }]), true);
  assert.equal(orderIncludesStlDownload([{ name: "Slip Ons" }]), false);
});
