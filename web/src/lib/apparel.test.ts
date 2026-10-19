import assert from "node:assert/strict";
import { test } from "node:test";
import {
  APPAREL_SIZES,
  HOODIE_MIN_SALE_CENTS,
  apparelProductShopHref,
  apparelProductShopLabel,
  apparelUnavailableSizes,
  apparelVariantStock,
  apparelCoverObjectPositionClass,
  catalogOverrideUnitCents,
  getApparelImages,
  getApparelItem,
  getApparelListingOffer,
  getApparelSizeOffer,
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

test("grey is out of stock across apparel; shirt white Medium and Large are in stock", () => {
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
  assert.equal(isApparelSizeAvailable(tee, "L"), true);
  assert.equal(isApparelSizeAvailable(tee, "M"), true);
  assert.deepEqual(apparelUnavailableSizes(tee), ["XS", "S", "XL", "XXL"]);

  assert.equal(isApparelColorOutOfStock(hoodie, "grey"), true);
  assert.equal(isApparelColorOutOfStock(hoodie, "black"), false);
  assert.equal(apparelVariantStock(hoodie, "grey"), 0);
  assert.equal(isApparelSizeAvailable(hoodie, "M"), true);

  const hoodieOffer = getApparelListingOffer("voronyz-core-hoodie");
  assert.ok(hoodieOffer);
  assert.equal(hoodie.priceCents, hoodieOffer.priceCents);

  assert.equal(isApparelColorOutOfStock(shades, "grey"), true);
  assert.equal(apparelVariantStock(shades, "black"), 0);
  assert.equal(apparelVariantStock(shades, "grey"), 0);
});

test("hoodie sale prices change by size, stay $70–$100, and advertise a deep cut off the raised compare-at", () => {
  const xs = getApparelSizeOffer("voronyz-core-hoodie", "xs");
  const m = getApparelSizeOffer("voronyz-core-hoodie", "M");
  const xxl = getApparelSizeOffer("voronyz-core-hoodie", "XXL");
  assert.ok(xs && m && xxl);

  assert.ok(xs.priceCents < m.priceCents);
  assert.ok(m.priceCents < xxl.priceCents);

  for (const size of APPAREL_SIZES) {
    const offer = getApparelSizeOffer("voronyz-core-hoodie", size);
    assert.ok(offer);
    assert.ok(offer.priceCents >= HOODIE_MIN_SALE_CENTS);
    assert.ok(offer.priceCents <= 10000);
    assert.ok(offer.compareAtCents > offer.priceCents);
    assert.ok(offer.percentOff >= 55);
    assert.ok(offer.percentOff <= 62);
    assert.equal(catalogOverrideUnitCents("voronyz-core-hoodie", size), offer.priceCents);
  }

  assert.equal(getApparelSizeOffer("voronyz-core-hoodie", "M")?.percentOff, 60);
  assert.equal(getApparelSizeOffer("voronyz-oversized-tee", "M"), null);
  assert.equal(catalogOverrideUnitCents("voronyz-oversized-tee", "M"), null);
});
