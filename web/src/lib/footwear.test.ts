import assert from "node:assert/strict";
import { test } from "node:test";
import { GATORS_SIZES } from "./gators";
import { LATTICE_INSOLES_SIZES } from "./latticeInsoles";
import {
  FOOTWEAR_CATALOG,
  FOOTWEAR_SLUGS,
  SLIP_ONS_WHITE_AD_IMAGE,
  isWhiteColor,
  slipOnsImagesForColor,
} from "./footwear";

const studio = [
  "/products/slip-ons/InShot_20260405_202911983.jpg",
  "/products/slip-ons/InShot_20260405_203151152.jpg",
];

test("lattice insoles use the same US sizes as the rest of the footwear lineup", () => {
  assert.deepEqual([...LATTICE_INSOLES_SIZES], [...GATORS_SIZES]);
});

test("All Footwear lists Dragonfly third, before Gators", () => {
  assert.deepEqual(FOOTWEAR_SLUGS, [
    "v3-slides",
    "slip-ons",
    "dragonfly",
    "gators",
    "magikid-shoes",
    "voronyz-lattice-insoles",
  ]);
  assert.equal(FOOTWEAR_CATALOG[2]?.slug, "dragonfly");
});

test("white color names match the White swatch", () => {
  assert.equal(isWhiteColor("white"), true);
  assert.equal(isWhiteColor("White"), true);
  assert.equal(isWhiteColor(" white "), true);
  assert.equal(isWhiteColor("black"), false);
  assert.equal(isWhiteColor(undefined), false);
});

test("slip-ons gallery leads with the white ad only when White is selected", () => {
  assert.deepEqual(slipOnsImagesForColor(studio, "black"), [
    ...studio,
    SLIP_ONS_WHITE_AD_IMAGE,
  ]);
  assert.deepEqual(slipOnsImagesForColor(studio, undefined), [
    ...studio,
    SLIP_ONS_WHITE_AD_IMAGE,
  ]);
  assert.deepEqual(slipOnsImagesForColor(studio, "white"), [
    SLIP_ONS_WHITE_AD_IMAGE,
    ...studio,
  ]);
  assert.equal(slipOnsImagesForColor(studio, "White")[0], SLIP_ONS_WHITE_AD_IMAGE);
});

test("white ad is not duplicated if it is already in the studio list", () => {
  const withAd = [studio[0], SLIP_ONS_WHITE_AD_IMAGE, studio[1]];
  assert.deepEqual(slipOnsImagesForColor(withAd, "white"), [
    SLIP_ONS_WHITE_AD_IMAGE,
    studio[0],
    studio[1],
  ]);
  assert.deepEqual(slipOnsImagesForColor(withAd, "grey"), [
    studio[0],
    studio[1],
    SLIP_ONS_WHITE_AD_IMAGE,
  ]);
});
