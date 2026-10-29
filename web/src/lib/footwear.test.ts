import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { GATORS_SIZES } from "./gators";
import {
  LATTICE_INSOLES_PRODUCT_IMAGE_URL,
  LATTICE_INSOLES_SIDE_IMAGE_URL,
  LATTICE_INSOLES_SIZES,
  LATTICE_INSOLES_SLUG,
  LATTICE_INSOLES_THUMBNAIL_URL,
  latticeInsolesCatalogProduct,
} from "./latticeInsoles";
import {
  FOOTWEAR_CATALOG,
  FOOTWEAR_SLUGS,
  SLIP_ONS_WHITE_AD_IMAGE,
  isWhiteColor,
  slipOnsImagesForColor,
} from "./footwear";
import { getProductThumbnail } from "./productImages";

const productPage = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../app/products/[slug]/page.tsx"),
  "utf8",
);

const studio = [
  "/products/slip-ons/InShot_20260405_202911983.jpg",
  "/products/slip-ons/InShot_20260405_203151152.jpg",
];

test("lattice insoles use the same US sizes as the rest of the footwear lineup", () => {
  assert.deepEqual([...LATTICE_INSOLES_SIZES], [...GATORS_SIZES]);
});

test("Lattice Insoles listing uses a single side-view insole; PDP keeps pair then side", () => {
  const lattice = FOOTWEAR_CATALOG.find((item) => item.slug === LATTICE_INSOLES_SLUG);
  assert.equal(lattice?.images[0], LATTICE_INSOLES_PRODUCT_IMAGE_URL);
  assert.equal(lattice?.images[1], LATTICE_INSOLES_SIDE_IMAGE_URL);
  assert.equal(
    getProductThumbnail({ slug: LATTICE_INSOLES_SLUG, images: lattice?.images }),
    LATTICE_INSOLES_THUMBNAIL_URL,
  );
  assert.deepEqual(latticeInsolesCatalogProduct().images, [
    LATTICE_INSOLES_PRODUCT_IMAGE_URL,
    LATTICE_INSOLES_SIDE_IMAGE_URL,
  ]);
});

test("lattice insole PDP uses shoe gender sizing instead of S–XL catalog sizes", () => {
  assert.doesNotMatch(productPage, /isLatticeInsoles && \{\s*useCatalogSizes:\s*true/s);
  assert.doesNotMatch(productPage, /S · M · L · XL/);
  assert.match(productPage, /US shoe sizes/);
  assert.match(
    productPage,
    /The same US Men's, Women's, and Kids' sizes as Voronyz shoes/,
  );
});

test("Dragonfly thumbnail is the side-profile photo", () => {
  const dragonfly = FOOTWEAR_CATALOG.find((item) => item.slug === "dragonfly");
  const sideProfile = "/products/dragonfly/InShot_20260212_153903491.jpg";
  const threeQuarter = "/products/dragonfly/InShot_20260212_153516456.jpg";
  assert.equal(dragonfly?.images[0], sideProfile);
  assert.equal(dragonfly?.images[1], threeQuarter);
  assert.equal(getProductThumbnail({ slug: "dragonfly", images: dragonfly?.images }), sideProfile);
  assert.match(
    productPage,
    /const dragonflyImages = \[\s*"\/products\/dragonfly\/InShot_20260212_153903491\.jpg",/,
  );
});

test("All Footwear lists Gators last while they are coming soon", () => {
  assert.deepEqual(FOOTWEAR_SLUGS, [
    "v3-slides",
    "slip-ons",
    "dragonfly",
    "magikid-shoes",
    "voronyz-lattice-insoles",
    "gators",
  ]);
  assert.equal(FOOTWEAR_CATALOG.at(-1)?.slug, "gators");
});

test("white color names match the White swatch", () => {
  assert.equal(isWhiteColor("white"), true);
  assert.equal(isWhiteColor("White"), true);
  assert.equal(isWhiteColor(" white "), true);
  assert.equal(isWhiteColor("black"), false);
  assert.equal(isWhiteColor(undefined), false);
});

test("slip-ons gallery shows the white photo only when White is selected", () => {
  assert.deepEqual(slipOnsImagesForColor(studio, "black"), [...studio]);
  assert.deepEqual(slipOnsImagesForColor(studio, undefined), [...studio]);
  assert.deepEqual(slipOnsImagesForColor(studio, "white"), [
    SLIP_ONS_WHITE_AD_IMAGE,
    ...studio,
  ]);
  assert.equal(slipOnsImagesForColor(studio, "White")[0], SLIP_ONS_WHITE_AD_IMAGE);
});

test("white photo is not duplicated if it is already in the studio list", () => {
  const withAd = [studio[0], SLIP_ONS_WHITE_AD_IMAGE, studio[1]];
  assert.deepEqual(slipOnsImagesForColor(withAd, "white"), [
    SLIP_ONS_WHITE_AD_IMAGE,
    studio[0],
    studio[1],
  ]);
  assert.deepEqual(slipOnsImagesForColor(withAd, "grey"), [studio[0], studio[1]]);
});
