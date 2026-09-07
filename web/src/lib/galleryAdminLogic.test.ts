import assert from "node:assert/strict";
import { test } from "node:test";
import {
  galleryStatusChangeIsRemoval,
  isShownOnPublicGallery,
  shouldShowGalleryDeleteButton,
  shouldShowGalleryRejectButton,
} from "./galleryAdminLogic";

test("only approved photos appear on /gallery", () => {
  assert.equal(isShownOnPublicGallery("approved"), true);
  assert.equal(isShownOnPublicGallery("pending"), false);
  assert.equal(isShownOnPublicGallery("rejected"), false);
});

test("rejecting a photo is the same as deleting it", () => {
  assert.equal(galleryStatusChangeIsRemoval("rejected"), true);
  assert.equal(galleryStatusChangeIsRemoval("approved"), false);
  assert.equal(galleryStatusChangeIsRemoval("pending"), false);
});

test("pending uploads show Reject instead of Delete", () => {
  assert.equal(shouldShowGalleryRejectButton("submission", "pending"), true);
  assert.equal(shouldShowGalleryDeleteButton("submission", "pending"), false);
});

test("approved or leftover rejected uploads show Delete, not Reject", () => {
  assert.equal(shouldShowGalleryRejectButton("submission", "approved"), false);
  assert.equal(shouldShowGalleryDeleteButton("submission", "approved"), true);
  assert.equal(shouldShowGalleryRejectButton("submission", "rejected"), false);
  assert.equal(shouldShowGalleryDeleteButton("submission", "rejected"), true);
});

test("site catalog photos can only be deleted", () => {
  assert.equal(shouldShowGalleryRejectButton("catalog", "approved"), false);
  assert.equal(shouldShowGalleryDeleteButton("catalog", "approved"), true);
});
