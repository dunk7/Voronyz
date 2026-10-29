import assert from "node:assert/strict";
import { test } from "node:test";
import { STL_FILES_SLUG, orderIncludesStlDownload } from "./stlFiles";
import { getSlipOnStlZipPath } from "./stlPurchaseDownload";

test("detects an STL purchase from slug or name", () => {
  assert.equal(orderIncludesStlDownload([{ productSlug: STL_FILES_SLUG }]), true);
  assert.equal(
    orderIncludesStlDownload([{ name: "Voronyz Slip On STL - file size Download" }]),
    true
  );
  assert.equal(orderIncludesStlDownload([{ productSlug: "tpu-90a-filament" }]), false);
  assert.equal(orderIncludesStlDownload([{ name: "Slip Ons" }]), false);
});

test("finds the packaged slip-on zip in this checkout", () => {
  const zip = getSlipOnStlZipPath();
  assert.ok(zip, "expected voronyz-slip-on.zip next to the private STL files");
  assert.equal(zip!.fileName, "voronyz-slip-on.zip");
});
