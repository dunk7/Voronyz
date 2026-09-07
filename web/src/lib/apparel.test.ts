import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apparelProductShopHref,
  apparelProductShopLabel,
  getApparelItem,
} from "./apparel";
import { isComingSoonPreOrderProduct } from "./preorder";

test("core hoodie listing is named The Atelier Hoodie", () => {
  assert.equal(getApparelItem("voronyz-core-hoodie")?.name, "The Atelier Hoodie");
});

test("The Atelier Hoodie is a live listing, not a pre-order", () => {
  assert.equal(getApparelItem("voronyz-core-hoodie")?.comingSoon, false);
  assert.equal(isComingSoonPreOrderProduct("voronyz-core-hoodie"), false);
});

test("hoodie listing back link returns to Apparel", () => {
  assert.equal(apparelProductShopHref("voronyz-core-hoodie"), "/apparel");
  assert.equal(apparelProductShopLabel("voronyz-core-hoodie"), "Back to Apparel");
});

test("tee listing back link returns to Apparel", () => {
  assert.equal(apparelProductShopHref("voronyz-oversized-tee"), "/apparel");
  assert.equal(apparelProductShopLabel("voronyz-oversized-tee"), "Back to Apparel");
});

test("accessory listings still return to Accessories", () => {
  assert.equal(apparelProductShopHref("voronyz-cool-shades"), "/apparel/accessories");
  assert.equal(apparelProductShopLabel("voronyz-cool-shades"), "Back to Accessories");
});

test("unknown apparel slugs fall back to Apparel", () => {
  assert.equal(apparelProductShopHref("not-a-product"), "/apparel");
  assert.equal(apparelProductShopLabel("not-a-product"), "Back to Apparel");
});
