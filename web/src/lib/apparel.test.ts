import assert from "node:assert/strict";
import { test } from "node:test";
import {
  APPAREL_SIZES,
  HOODIE_MIN_SALE_CENTS,
  apparelCatalogProduct,
  apparelProductShopHref,
  apparelProductShopLabel,
  apparelUnavailableSizes,
  apparelVariantStock,
  apparelCoverObjectPositionClass,
  apparelPriceCentsForSelection,
  apparelPriceCentsForSize,
  catalogUnitPriceCents,
  getApparelImages,
  getApparelImagesForColor,
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

test("The Atelier Hoodie ships in black, grey, and white with matching front and back shots", () => {
  const hoodie = getApparelItem("voronyz-core-hoodie");
  assert.ok(hoodie);
  assert.deepEqual(hoodie.colors, ["black", "grey", "white"]);
  assert.equal(hoodie.outOfStockColors, undefined);
  assert.equal(hoodie.image, "/products/apparel/hoodie.jpg");
  assert.deepEqual(getApparelImages(hoodie), [
    "/products/apparel/hoodie.jpg",
    "/products/apparel/hoodie-black-back.jpg",
  ]);
  assert.deepEqual(getApparelImagesForColor(hoodie, "black"), [
    "/products/apparel/hoodie.jpg",
    "/products/apparel/hoodie-black-back.jpg",
  ]);
  assert.deepEqual(getApparelImagesForColor(hoodie, "grey"), [
    "/products/apparel/hoodie-grey-front.jpg",
    "/products/apparel/hoodie-grey-back.jpg",
  ]);
  assert.deepEqual(getApparelImagesForColor(hoodie, "white"), [
    "/products/apparel/hoodie-white-front.jpg",
    "/products/apparel/hoodie-white-back.jpg",
  ]);
  assert.equal(isApparelColorOutOfStock(hoodie, "black"), false);
  assert.equal(isApparelColorOutOfStock(hoodie, "grey"), false);
  assert.equal(isApparelColorOutOfStock(hoodie, "white"), false);
  assert.equal(apparelVariantStock(hoodie, "black"), 999);

  const listing = apparelCatalogProduct(hoodie);
  assert.deepEqual(listing.primaryColors, ["black", "grey", "white"]);
  assert.deepEqual(
    listing.variants.map((variant) => variant.color),
    ["black", "grey", "white"],
  );
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

test("grey oversized tee has matching front and back shots with the same chest logo layout", () => {
  const tee = getApparelItem("voronyz-oversized-tee");
  assert.ok(tee);
  assert.deepEqual(getApparelImagesForColor(tee, "grey"), [
    "/products/apparel/shirt-front-grey.jpg",
    "/products/apparel/shirt-back-blank-grey.jpg",
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

test("grey is in stock on tees and the hoodie, and out of stock on shades; oversized tee sizes XS–XXL are in stock", () => {
  const tee = getApparelItem("voronyz-oversized-tee");
  const hoodie = getApparelItem("voronyz-core-hoodie");
  const shades = getApparelItem("voronyz-cool-shades");
  assert.ok(tee && hoodie && shades);

  assert.equal(isApparelColorOutOfStock(tee, "grey"), false);
  assert.equal(isApparelColorOutOfStock(tee, "white"), false);
  assert.equal(isApparelColorOutOfStock(tee, "black"), false);
  assert.equal(apparelVariantStock(tee, "black"), 999);
  assert.equal(apparelVariantStock(tee, "white"), 999);
  assert.equal(apparelVariantStock(tee, "grey"), 999);
  for (const size of tee.sizes) {
    assert.equal(isApparelSizeAvailable(tee, size), true);
  }
  assert.deepEqual(apparelUnavailableSizes(tee), []);

  assert.equal(isApparelColorOutOfStock(hoodie, "black"), false);
  assert.equal(isApparelColorOutOfStock(hoodie, "grey"), false);
  assert.equal(isApparelColorOutOfStock(hoodie, "white"), false);
  assert.equal(apparelVariantStock(hoodie, "grey"), 999);
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
    color: "black",
    fallbackCents: 7800,
  }), 7200);
  assert.equal(catalogUnitPriceCents({
    productSlug: "v3-slides",
    size: "9",
    fallbackCents: 7500,
  }), 7500);
});

test("hoodie sale prices change by size, stay $70–$100, and advertise a deep cut off the raised compare-at", () => {
  const hoodie = getApparelItem("voronyz-core-hoodie");
  assert.ok(hoodie);
  const xs = getApparelSizeOffer("voronyz-core-hoodie", "xs");
  const m = getApparelSizeOffer("voronyz-core-hoodie", "M");
  const l = getApparelSizeOffer("voronyz-core-hoodie", "L");
  const xxl = getApparelSizeOffer("voronyz-core-hoodie", "XXL");
  assert.ok(xs && m && l && xxl);

  assert.ok(xs.priceCents < m.priceCents);
  assert.ok(m.priceCents < xxl.priceCents);
  assert.ok(l.priceCents < m.priceCents);
  const sizeAverage =
    APPAREL_SIZES.reduce((sum, size) => sum + apparelPriceCentsForSize(hoodie, size), 0) /
    APPAREL_SIZES.length;
  assert.ok(l.priceCents < sizeAverage);
  assert.equal(getApparelListingOffer("voronyz-core-hoodie")?.priceCents, m.priceCents);
  assert.equal(hoodie.priceCents, m.priceCents);

  for (const size of APPAREL_SIZES) {
    const offer = getApparelSizeOffer("voronyz-core-hoodie", size);
    assert.ok(offer);
    assert.ok(offer.priceCents >= HOODIE_MIN_SALE_CENTS);
    assert.ok(offer.priceCents <= 10000);
    assert.ok(offer.compareAtCents > offer.priceCents);
    assert.ok(offer.percentOff >= 55);
    assert.ok(offer.percentOff <= 62);
    assert.equal(
      catalogUnitPriceCents({
        productSlug: "voronyz-core-hoodie",
        size,
        fallbackCents: 7800,
      }),
      offer.priceCents,
    );
  }

  assert.equal(getApparelSizeOffer("voronyz-core-hoodie", "M")?.percentOff, 60);
  assert.equal(getApparelSizeOffer("voronyz-oversized-tee", "M"), null);
});

test("hoodie grey costs a little more than black and white is the most expensive", () => {
  const hoodie = getApparelItem("voronyz-core-hoodie");
  assert.ok(hoodie);
  const blackM = apparelPriceCentsForSelection(hoodie, { size: "M", color: "black" });
  const greyM = apparelPriceCentsForSelection(hoodie, { size: "M", color: "grey" });
  const whiteM = apparelPriceCentsForSelection(hoodie, { size: "M", color: "white" });
  assert.equal(blackM, 7800);
  assert.equal(greyM, 8400);
  assert.equal(whiteM, 9200);
  assert.ok(blackM < greyM);
  assert.ok(greyM < whiteM);
  assert.equal(
    apparelPriceCentsForSelection(hoodie, { size: "L", color: "grey" }),
    8000,
  );
  assert.equal(
    apparelPriceCentsForSelection(hoodie, { size: "L", color: "white" }),
    8800,
  );
  assert.equal(
    catalogUnitPriceCents({
      productSlug: "voronyz-core-hoodie",
      size: "M",
      color: "white",
      fallbackCents: 7800,
    }),
    9200,
  );
  const whiteOffer = getApparelSizeOffer("voronyz-core-hoodie", "M", "white");
  assert.ok(whiteOffer);
  assert.equal(whiteOffer.priceCents, 9200);
  assert.ok(whiteOffer.percentOff >= 55);
});
