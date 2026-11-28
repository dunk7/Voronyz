import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatOwnerSizeDetails,
  resolveOwnerPrintSize,
  womenApparelSizeToMen,
  womenShoeSizeToMen,
} from "./sizing";

test("women's US shoe sizes convert to men's by −1.5", () => {
  assert.equal(womenShoeSizeToMen("4"), "2.5");
  assert.equal(womenShoeSizeToMen("5"), "3.5");
  assert.equal(womenShoeSizeToMen("6"), "4.5");
  assert.equal(womenShoeSizeToMen("7"), "5.5");
  assert.equal(womenShoeSizeToMen("8"), "6.5");
  assert.equal(womenShoeSizeToMen("9"), "7.5");
  assert.equal(womenShoeSizeToMen("10"), "8.5");
  assert.equal(womenShoeSizeToMen("11"), "9.5");
});

test("women's apparel letters convert one size down for men's blanks", () => {
  assert.equal(womenApparelSizeToMen("XS"), "XS");
  assert.equal(womenApparelSizeToMen("S"), "XS");
  assert.equal(womenApparelSizeToMen("M"), "S");
  assert.equal(womenApparelSizeToMen("L"), "M");
  assert.equal(womenApparelSizeToMen("XL"), "L");
  assert.equal(womenApparelSizeToMen("XXL"), "XL");
  assert.equal(womenApparelSizeToMen("m"), "S");
});

test("owner print size keeps men's and kids as ordered", () => {
  assert.deepEqual(resolveOwnerPrintSize({ size: "10", gender: "men" }), {
    printSize: "10",
    printGender: "men",
    convertedFromWomen: false,
  });
  assert.deepEqual(resolveOwnerPrintSize({ size: "3", gender: "kids" }), {
    printSize: "3",
    printGender: "kids",
    convertedFromWomen: false,
  });
});

test("owner print size remaps women's shoes and apparel to men's", () => {
  assert.deepEqual(resolveOwnerPrintSize({ size: "8", gender: "women" }), {
    printSize: "6.5",
    printGender: "men",
    convertedFromWomen: true,
    orderedSize: "8",
    orderedGender: "women",
  });
  assert.deepEqual(resolveOwnerPrintSize({ size: "L", gender: "women" }), {
    printSize: "M",
    printGender: "men",
    convertedFromWomen: true,
    orderedSize: "L",
    orderedGender: "women",
  });
});

test("owner size details prefer men's print size with ordered note", () => {
  assert.equal(
    formatOwnerSizeDetails({ size: "8", gender: "women" }),
    "Size 6.5 Men's (ordered Women's 8)",
  );
  assert.equal(
    formatOwnerSizeDetails({ size: "M", gender: "women" }),
    "Size S Men's (ordered Women's M)",
  );
  assert.equal(
    formatOwnerSizeDetails({ size: "10", gender: "men" }),
    "Size 10 Men's",
  );
  assert.equal(
    formatOwnerSizeDetails({ size: "OWB", gender: null }),
    "OWB — Outside the Waistband",
  );
});
