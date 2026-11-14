import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STL_FILES_ALT_IMAGE_URL,
  STL_FILES_IMAGES,
  STL_FILES_NAME,
  STL_FILES_PRICE_CENTS,
  STL_FILES_PRODUCT_PREVIEW_IMAGES,
  STL_FILES_SLUG,
  STL_FILES_THUMBNAIL_URL,
  STL_FILES_VARIANTS,
  STL_SHOE_FILES,
  isDigitalProductSlug,
  orderIncludesStlDownload,
  stlShoeHasFile,
} from "./stlFiles";

test("STL listing is Voronyz STL at $1 per shoe file", () => {
  assert.equal(STL_FILES_SLUG, "super-high-tech-stl");
  assert.equal(STL_FILES_NAME, "Voronyz STL");
  assert.equal(STL_FILES_PRICE_CENTS, 100);
  assert.equal(isDigitalProductSlug(STL_FILES_SLUG), true);
  assert.equal(isDigitalProductSlug("slip-ons"), false);
  assert.equal(orderIncludesStlDownload([{ productSlug: STL_FILES_SLUG }]), true);
  assert.equal(orderIncludesStlDownload([{ name: "Slip Ons" }]), false);
});

test("STL thumbnail is wireframe art; product photos come after for gallery scroll", () => {
  assert.equal(STL_FILES_THUMBNAIL_URL, "/products/stl-files/cover-card.jpg");
  assert.equal(STL_FILES_ALT_IMAGE_URL, "/products/stl-files/alt-card.jpg");
  assert.equal(STL_FILES_IMAGES[0], STL_FILES_THUMBNAIL_URL);
  assert.equal(STL_FILES_IMAGES[1], STL_FILES_ALT_IMAGE_URL);
  // Listing art stays on the dedicated stl-files wireframe assets.
  assert.equal(STL_FILES_THUMBNAIL_URL.includes("/products/slip-ons/"), false);
  assert.equal(STL_FILES_ALT_IMAGE_URL.includes("/products/slip-ons/"), false);
  // After click, shoppers can scroll past the mesh to real Slip On photos.
  assert.deepEqual(
    [...STL_FILES_IMAGES.slice(2)],
    [...STL_FILES_PRODUCT_PREVIEW_IMAGES]
  );
  assert.ok(STL_FILES_PRODUCT_PREVIEW_IMAGES.length >= 3);
  assert.equal(
    STL_FILES_PRODUCT_PREVIEW_IMAGES.every((src) =>
      src.startsWith("/products/slip-ons/")
    ),
    true
  );
});

test("only Slip Ons has an STL file; others are out of stock and Magikid/insoles are gone", () => {
  assert.deepEqual(
    STL_SHOE_FILES.map((shoe) => shoe.id),
    ["v3-slides", "slip-ons", "dragonfly", "gators"]
  );
  assert.equal(
    STL_SHOE_FILES.some((shoe) => shoe.id === "magikid-shoes"),
    false
  );
  assert.equal(
    STL_SHOE_FILES.some((shoe) => shoe.id === "voronyz-lattice-insoles"),
    false
  );

  const slipOns = STL_SHOE_FILES.find((shoe) => shoe.id === "slip-ons");
  assert.equal(stlShoeHasFile(slipOns), true);
  assert.equal(
    STL_SHOE_FILES.filter((shoe) => !stlShoeHasFile(shoe)).every((shoe) => shoe.file === null),
    true
  );

  for (const variant of STL_FILES_VARIANTS) {
    const shoe = STL_SHOE_FILES.find((item) => item.id === variant.color);
    assert.ok(shoe);
    assert.equal(variant.stock, stlShoeHasFile(shoe) ? 9999 : 0);
  }
});
