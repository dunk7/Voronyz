import assert from "node:assert/strict";
import { test } from "node:test";
import { getProductThumbnail } from "./productImages";
import {
  magikidCatalogProduct,
  MAGIKID_SHOES_COVER,
  MAGIKID_SHOES_IMAGES,
  MAGIKID_SHOES_THUMBNAIL_URL,
} from "./magikidShoesThumbnail";

test("Magikid listing cover is the former third gallery photo", () => {
  assert.equal(MAGIKID_SHOES_COVER, "/products/slip-ons/InShot_20260405_203425292.jpg");
  assert.equal(MAGIKID_SHOES_IMAGES[0], MAGIKID_SHOES_COVER);
});

test("former Magikid thumbnail is the second gallery photo", () => {
  assert.equal(MAGIKID_SHOES_IMAGES[1], MAGIKID_SHOES_THUMBNAIL_URL);
});

test("cover is not repeated later in the Magikid gallery", () => {
  assert.equal(
    MAGIKID_SHOES_IMAGES.filter((src) => src === MAGIKID_SHOES_COVER).length,
    1,
  );
});

test("shop-card thumbnail uses the Magikid cover photo", () => {
  assert.equal(getProductThumbnail({ slug: "magikid-shoes" }), MAGIKID_SHOES_COVER);
});

test("Magikid catalog fallback uses the reordered gallery", () => {
  const product = magikidCatalogProduct();
  assert.equal(product.images[0], MAGIKID_SHOES_COVER);
  assert.equal(product.images[1], MAGIKID_SHOES_THUMBNAIL_URL);
});
