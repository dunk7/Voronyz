import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apparelProductShopHref,
  apparelProductShopLabel,
  apparelUnavailableSizes,
  apparelVariantStock,
  getApparelItem,
  isApparelColorOutOfStock,
  isApparelSizeAvailable,
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

test("grey is out of stock across apparel; shirt also has white OOS and Large only", () => {
  const tee = getApparelItem("voronyz-oversized-tee");
  const hoodie = getApparelItem("voronyz-core-hoodie");
  const shades = getApparelItem("voronyz-cool-shades");
  assert.ok(tee && hoodie && shades);

  assert.equal(isApparelColorOutOfStock(tee, "grey"), true);
  assert.equal(isApparelColorOutOfStock(tee, "white"), true);
  assert.equal(isApparelColorOutOfStock(tee, "black"), false);
  assert.equal(apparelVariantStock(tee, "black"), 999);
  assert.equal(apparelVariantStock(tee, "white"), 0);
  assert.equal(apparelVariantStock(tee, "grey"), 0);
  assert.equal(isApparelSizeAvailable(tee, "L"), true);
  assert.equal(isApparelSizeAvailable(tee, "M"), false);
  assert.deepEqual(apparelUnavailableSizes(tee), ["XS", "S", "M", "XL", "XXL"]);

  assert.equal(isApparelColorOutOfStock(hoodie, "grey"), true);
  assert.equal(isApparelColorOutOfStock(hoodie, "black"), false);
  assert.equal(apparelVariantStock(hoodie, "grey"), 0);
  assert.equal(isApparelSizeAvailable(hoodie, "M"), true);

  assert.equal(isApparelColorOutOfStock(shades, "grey"), true);
  assert.equal(apparelVariantStock(shades, "black"), 0);
  assert.equal(apparelVariantStock(shades, "grey"), 0);
});
