import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SLIP_ONS_WHITE_AD_IMAGE,
  isWhiteColor,
  slipOnsImagesForColor,
} from "./footwear";

const studio = [
  "/products/slip-ons/InShot_20260405_202911983.jpg",
  "/products/slip-ons/InShot_20260405_203151152.jpg",
];

test("white color names match the White swatch", () => {
  assert.equal(isWhiteColor("white"), true);
  assert.equal(isWhiteColor("White"), true);
  assert.equal(isWhiteColor(" white "), true);
  assert.equal(isWhiteColor("black"), false);
  assert.equal(isWhiteColor(undefined), false);
});

test("slip-ons gallery leads with the white ad only when White is selected", () => {
  assert.deepEqual(slipOnsImagesForColor(studio, "black"), studio);
  assert.deepEqual(slipOnsImagesForColor(studio, undefined), studio);
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
  assert.deepEqual(slipOnsImagesForColor(withAd, "grey"), studio);
});
