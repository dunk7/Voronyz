import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STL_FILES_NAME,
  STL_FILES_PRICE_CENTS,
  STL_FILES_SLUG,
  STL_FILES_THUMBNAIL_URL,
  STL_FILES_VARIANTS,
  STL_SHOE_FILES,
  STL_SHOE_THUMBNAILS,
  isDigitalProductSlug,
  orderIncludesStlDownload,
  stlImagesByShoe,
  stlShoeHasFile,
  stlThumbnailForShoe,
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

test("only Slip Ons has an STL file; others are out of stock and Magikid/insoles are gone", () => {
  assert.deepEqual(
    STL_SHOE_FILES.map((shoe) => shoe.id),
    ["slip-ons", "dragonfly", "v3-slides", "gators"]
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

test("STL gallery thumbnail follows the selected shoe", () => {
  assert.equal(STL_FILES_THUMBNAIL_URL, STL_SHOE_THUMBNAILS["slip-ons"]);
  assert.equal(stlThumbnailForShoe("slip-ons"), STL_SHOE_THUMBNAILS["slip-ons"]);
  assert.equal(stlThumbnailForShoe("dragonfly"), STL_SHOE_THUMBNAILS.dragonfly);
  assert.notEqual(stlThumbnailForShoe("slip-ons"), stlThumbnailForShoe("dragonfly"));

  const byShoe = stlImagesByShoe();
  assert.deepEqual(byShoe["slip-ons"], [STL_SHOE_THUMBNAILS["slip-ons"]]);
  assert.deepEqual(byShoe.dragonfly, [STL_SHOE_THUMBNAILS.dragonfly]);
  assert.deepEqual(byShoe["v3-slides"], [STL_SHOE_THUMBNAILS["v3-slides"]]);
  assert.deepEqual(byShoe.gators, [STL_SHOE_THUMBNAILS.gators]);
});
