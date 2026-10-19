import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apparelProductShopHref,
  apparelProductShopLabel,
  apparelUnavailableSizes,
  apparelVariantStock,
  apparelCoverObjectPositionClass,
  apparelPriceCentsForSize,
  catalogUnitPriceCents,
  getApparelImages,
  getApparelImagesForColor,
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

test("oversized tee leads with the chest-logo front shot, then the blank back photo", () => {
  const tee = getApparelItem("voronyz-oversized-tee");
  assert.ok(tee);
  assert.equal(tee.image, "/products/apparel/shirt-front.jpg");
  assert.deepEqual(getApparelImages(tee), [
    "/products/apparel/shirt-front.jpg",
    "/products/apparel/shirt-back-blank.jpg",
  ]);
});

test("white oversized tee uses the black-logo mockup and a plain white back", () => {
  const tee = getApparelItem("voronyz-oversized-tee");
  assert.ok(tee);
  assert.deepEqual(getApparelImagesForColor(tee, "white"), [
    "/products/apparel/shirt-front-white.jpg",
    "/products/apparel/shirt-back-blank-white.jpg",
  ]);
  assert.deepEqual(getApparelImagesForColor(tee, "black"), [
    "/products/apparel/shirt-front.jpg",
    "/products/apparel/shirt-back-blank.jpg",
  ]);
});

test("flat-lay tee photos keep a centered square crop", () => {
  assert.equal(
    apparelCoverObjectPositionClass("/products/apparel/shirt-back-blank.jpg"),
    "object-center",
  );
  assert.equal(
    apparelCoverObjectPositionClass("/products/apparel/shirt-front.jpg"),
    "object-center",
  );
});

test("accessory listings still return to Accessories", () => {
  assert.equal(apparelProductShopHref("voronyz-cool-shades"), "/apparel/accessories");
  assert.equal(apparelProductShopLabel("voronyz-cool-shades"), "Back to Accessories");
});

test("unknown apparel slugs fall back to Apparel", () => {
  assert.equal(apparelProductShopHref("not-a-product"), "/apparel");
  assert.equal(apparelProductShopLabel("not-a-product"), "Back to Apparel");
});

test("grey is out of stock across apparel; oversized tee sizes XS–XXL are in stock", () => {
  const tee = getApparelItem("voronyz-oversized-tee");
  const hoodie = getApparelItem("voronyz-core-hoodie");
  const shades = getApparelItem("voronyz-cool-shades");
  assert.ok(tee && hoodie && shades);

  assert.equal(isApparelColorOutOfStock(tee, "grey"), true);
  assert.equal(isApparelColorOutOfStock(tee, "white"), false);
  assert.equal(isApparelColorOutOfStock(tee, "black"), false);
  assert.equal(apparelVariantStock(tee, "black"), 999);
  assert.equal(apparelVariantStock(tee, "white"), 999);
  assert.equal(apparelVariantStock(tee, "grey"), 0);
  for (const size of tee.sizes) {
    assert.equal(isApparelSizeAvailable(tee, size), true);
  }
  assert.deepEqual(apparelUnavailableSizes(tee), []);

  assert.equal(isApparelColorOutOfStock(hoodie, "grey"), true);
  assert.equal(isApparelColorOutOfStock(hoodie, "black"), false);
  assert.equal(apparelVariantStock(hoodie, "grey"), 0);
  assert.equal(isApparelSizeAvailable(hoodie, "M"), true);

  assert.equal(isApparelColorOutOfStock(shades, "grey"), true);
  assert.equal(apparelVariantStock(shades, "black"), 0);
  assert.equal(apparelVariantStock(shades, "grey"), 0);
});

test("oversized tee price goes down for smaller sizes and up for larger sizes", () => {
  const tee = getApparelItem("voronyz-oversized-tee");
  assert.ok(tee);
  assert.equal(apparelPriceCentsForSize(tee, "XS"), 4200);
  assert.equal(apparelPriceCentsForSize(tee, "S"), 4500);
  assert.equal(apparelPriceCentsForSize(tee, "M"), 4800);
  assert.equal(apparelPriceCentsForSize(tee, "L"), 5100);
  assert.equal(apparelPriceCentsForSize(tee, "XL"), 5400);
  assert.equal(apparelPriceCentsForSize(tee, "XXL"), 5700);
  assert.equal(apparelPriceCentsForSize(tee, "XS") < apparelPriceCentsForSize(tee, "M"), true);
  assert.equal(apparelPriceCentsForSize(tee, "XXL") > apparelPriceCentsForSize(tee, "M"), true);
  assert.equal(catalogUnitPriceCents({
    productSlug: "voronyz-oversized-tee",
    size: "XL",
    fallbackCents: 4800,
  }), 5400);
  assert.equal(catalogUnitPriceCents({
    productSlug: "voronyz-core-hoodie",
    size: "XS",
    fallbackCents: 7800,
  }), 7800);
  assert.equal(catalogUnitPriceCents({
    productSlug: "v3-slides",
    size: "9",
    fallbackCents: 7500,
  }), 7500);
});
