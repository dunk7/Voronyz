import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STL_FILES_ALT_IMAGE_URL,
  STL_FILES_IMAGES,
  STL_FILES_NAME,
  STL_FILES_PRICE_CENTS,
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

test("STL thumbnail shows the open-back Slip On that matches the downloadable file", () => {
  assert.equal(STL_FILES_THUMBNAIL_URL, "/products/stl-files/cover.jpg");
  assert.equal(STL_FILES_ALT_IMAGE_URL, "/products/stl-files/alt.jpg");
  assert.deepEqual([...STL_FILES_IMAGES], [
    "/products/stl-files/cover.jpg",
    "/products/stl-files/alt.jpg",
  ]);
  assert.equal(STL_FILES_THUMBNAIL_URL.includes("layers.jpg"), false);
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
