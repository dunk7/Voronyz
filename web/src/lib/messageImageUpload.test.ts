import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inferMimeType,
  inferMimeTypeFromBytes,
  normalizeMimeType,
  sniffImageMimeType,
  validateAvatarFile,
  validateAvatarMeta,
} from "./messageAttachment";
import {
  isImageUploadFile,
  prepareMessageImage,
} from "./prepareImageUpload";

function jpegBytes(): Uint8Array {
  return Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
}

function pngBytes(): Uint8Array {
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52,
  ]);
}

function heicBytes(): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
  return bytes;
}

test("normalizeMimeType maps common JPEG/PNG aliases", () => {
  assert.equal(normalizeMimeType("image/jpg"), "image/jpeg");
  assert.equal(normalizeMimeType("image/pjpeg"), "image/jpeg");
  assert.equal(normalizeMimeType("image/x-png"), "image/png");
  assert.equal(normalizeMimeType("image/jpeg; charset=binary"), "image/jpeg");
});

test("sniffImageMimeType detects JPEG, PNG, and HEIC", () => {
  assert.equal(sniffImageMimeType(jpegBytes()), "image/jpeg");
  assert.equal(sniffImageMimeType(pngBytes()), "image/png");
  assert.equal(sniffImageMimeType(heicBytes()), "image/heic");
});

test("inferMimeType does not trust octet-stream when the filename is a photo", () => {
  const png = new File([pngBytes()], "pic.png", {
    type: "application/octet-stream",
  });
  assert.equal(inferMimeType(png), "image/png");
  assert.equal(isImageUploadFile(png), true);
});

test("inferMimeType maps image/jpg so avatars are not rejected", () => {
  const jpeg = new File([jpegBytes()], "photo.jpg", { type: "image/jpg" });
  assert.equal(inferMimeType(jpeg), "image/jpeg");
  assert.equal(validateAvatarFile(jpeg), null);
});

test("inferMimeTypeFromBytes prefers magic bytes over a wrong declared type", () => {
  const mime = inferMimeTypeFromBytes("photo.jpg", "image/jpeg", pngBytes());
  assert.equal(mime, "image/png");
  assert.equal(validateAvatarMeta(pngBytes().byteLength, mime), null);
});

test("a 500x500-named PNG with a generic MIME still prepares as PNG", async () => {
  const file = new File([pngBytes()], "resized-500x500.png", {
    type: "application/octet-stream",
  });
  const prepared = await prepareMessageImage(file);
  assert.equal(prepared.type, "image/png");
  assert.equal(isImageUploadFile(prepared), true);
});

test("JPEG labeled as image/jpg prepares with a canonical type", async () => {
  const file = new File([jpegBytes()], "photo.jpg", { type: "image/jpg" });
  const prepared = await prepareMessageImage(file);
  assert.equal(prepared.type, "image/jpeg");
});
