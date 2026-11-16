import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  GATORS_LISTING_COVER_URL,
  GATORS_SIZES,
  GATORS_SLUG,
  GATORS_THUMBNAIL_URL,
} from "./gators";
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
  SLIP_ONS_COLOR_IMAGES,
  SLIP_ONS_WHITE_AD_IMAGE,
  isBlackSlipOnColor,
  isWhiteColor,
  slipOnsColorImages,
  slipOnsImagesForColor,
  slipOnsStudioImages,
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
  assert.match(LATTICE_INSOLES_THUMBNAIL_URL, /listing-v2\.jpg$/);
  assert.match(LATTICE_INSOLES_PRODUCT_IMAGE_URL, /lattice-insoles-v2\.jpg$/);
  assert.match(LATTICE_INSOLES_SIDE_IMAGE_URL, /side-v2\.jpg$/);
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

test("Gators catalog photos are a centered black clog on white, not the forest crop", () => {
  const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../..", "public");
  assert.equal(GATORS_THUMBNAIL_URL, "/products/gators/gators-studio.jpg");
  assert.equal(GATORS_LISTING_COVER_URL, "/products/gators/gators-listing-cover.jpg");
  assert.equal(
    getProductThumbnail({ slug: GATORS_SLUG, images: [GATORS_THUMBNAIL_URL] }),
    GATORS_THUMBNAIL_URL,
  );
  assert.ok(existsSync(join(publicDir, GATORS_THUMBNAIL_URL)));
  assert.ok(existsSync(join(publicDir, GATORS_LISTING_COVER_URL)));
  const browse = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../components/footwear/FootwearBrowse.tsx"),
    "utf8",
  );
  assert.match(browse, /GATORS_LISTING_COVER_URL/);
  assert.doesNotMatch(GATORS_THUMBNAIL_URL, /forest/);
  const productPageSrc = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../app/products/[slug]/page.tsx"),
    "utf8",
  );
  assert.match(productPageSrc, /gatorsCatalogProduct/);
});

test("All Footwear lists Gators last while they are coming soon", () => {
  assert.deepEqual(FOOTWEAR_SLUGS, [
    "v3-slides",
    "slip-ons",
    "dragonfly",
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

test("slip-ons black stays on the scrollable studio gallery", () => {
  assert.equal(isBlackSlipOnColor(undefined), true);
  assert.equal(isBlackSlipOnColor("black"), true);
  assert.equal(isBlackSlipOnColor("Black"), true);
  assert.equal(isBlackSlipOnColor("grey"), false);
  assert.deepEqual(slipOnsImagesForColor(studio, undefined), [...studio]);
  assert.deepEqual(slipOnsImagesForColor(studio, "black"), [...studio]);
  assert.deepEqual(slipOnsImagesForColor(studio, "Black"), [...studio]);
});

test("slip-ons non-black colors use one square hero image", () => {
  assert.deepEqual(slipOnsImagesForColor(studio, "white"), [
    SLIP_ONS_WHITE_AD_IMAGE,
  ]);
  assert.deepEqual(slipOnsImagesForColor(studio, "White"), [
    SLIP_ONS_WHITE_AD_IMAGE,
  ]);
  assert.deepEqual(slipOnsImagesForColor(studio, "grey"), [
    SLIP_ONS_COLOR_IMAGES.grey,
  ]);
  assert.deepEqual(slipOnsImagesForColor(studio, "orange"), [
    SLIP_ONS_COLOR_IMAGES.orange,
  ]);
  assert.deepEqual(slipOnsImagesForColor(studio, "pink"), [
    SLIP_ONS_COLOR_IMAGES.pink,
  ]);
});

test("slip-ons color heroes exist on disk; black maps to the studio set", () => {
  const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../..", "public");
  const mapped = slipOnsColorImages();
  assert.deepEqual(mapped.black, slipOnsStudioImages());
  assert.ok(mapped.black!.length > 1);
  for (const src of mapped.black!) {
    assert.ok(existsSync(join(publicDir, src)), src);
  }
  for (const color of ["grey", "white", "orange", "pink"] as const) {
    assert.equal(mapped[color]?.length, 1);
    assert.equal(mapped[color]?.[0], SLIP_ONS_COLOR_IMAGES[color]);
    assert.ok(existsSync(join(publicDir, mapped[color]![0]!)), mapped[color]![0]);
  }
  assert.equal(SLIP_ONS_COLOR_IMAGES.white, SLIP_ONS_WHITE_AD_IMAGE);
});

test("slip-ons color heroes are square on disk", () => {
  const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../..", "public");
  function jpegSize(path: string): { width: number; height: number } {
    const buf = readFileSync(path);
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1]!;
      if (marker === 0xd9 || marker === 0xda) break;
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xc2) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    throw new Error(`No SOF in ${path}`);
  }
  for (const rel of [
    SLIP_ONS_COLOR_IMAGES.black,
    SLIP_ONS_COLOR_IMAGES.grey,
    SLIP_ONS_COLOR_IMAGES.white,
    SLIP_ONS_COLOR_IMAGES.orange,
    SLIP_ONS_COLOR_IMAGES.pink,
  ]) {
    const { width, height } = jpegSize(join(publicDir, rel));
    assert.equal(width, height, `${rel} should be square (got ${width}x${height})`);
  }
});

test("color heroes and white ad are stripped from the studio fallback list", () => {
  const withAd = [studio[0], SLIP_ONS_WHITE_AD_IMAGE, studio[1], SLIP_ONS_COLOR_IMAGES.pink];
  assert.deepEqual(slipOnsImagesForColor(withAd, undefined), [studio[0], studio[1]]);
  assert.deepEqual(slipOnsImagesForColor(withAd, "black"), [studio[0], studio[1]]);
});
