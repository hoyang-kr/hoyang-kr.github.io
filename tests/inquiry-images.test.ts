import assert from "node:assert/strict";
import test from "node:test";
import {
  deduplicateInquiryImages,
  MAX_INQUIRY_IMAGE_BYTES,
  validateInquiryImages,
} from "@/lib/inquiry-images";

const image = (name: string, type: string, size = 1024, lastModified = 1) => ({
  name,
  type,
  size,
  lastModified,
});

test("zero inquiry images is valid", () => {
  assert.deepEqual(validateInquiryImages([]), { valid: true });
});

test("one JPG is valid", () => {
  assert.deepEqual(validateInquiryImages([image("photo.jpg", "image/jpeg")]), {
    valid: true,
  });
});

test("three valid inquiry images are valid", () => {
  assert.deepEqual(
    validateInquiryImages([
      image("one.jpg", "image/jpeg"),
      image("two.png", "image/png"),
      image("three.webp", "image/webp"),
    ]),
    { valid: true },
  );
});

test("four inquiry images are rejected", () => {
  const result = validateInquiryImages([
    image("one.jpg", "image/jpeg"),
    image("two.jpg", "image/jpeg"),
    image("three.jpg", "image/jpeg"),
    image("four.jpg", "image/jpeg"),
  ]);
  assert.equal(result.valid, false);
  if (!result.valid) assert.equal(result.code, "TOO_MANY_IMAGES");
});

test("an inquiry image larger than 5 MB is rejected", () => {
  const result = validateInquiryImages([
    image("large.jpg", "image/jpeg", MAX_INQUIRY_IMAGE_BYTES + 1),
  ]);
  assert.equal(result.valid, false);
  if (!result.valid) assert.equal(result.code, "IMAGE_TOO_LARGE");
});

test("a combined inquiry image size larger than 15 MB is rejected", () => {
  const result = validateInquiryImages([
    image("one.jpg", "image/jpeg", MAX_INQUIRY_IMAGE_BYTES + 1),
    image("two.jpg", "image/jpeg", MAX_INQUIRY_IMAGE_BYTES),
    image("three.jpg", "image/jpeg", MAX_INQUIRY_IMAGE_BYTES),
  ]);
  assert.equal(result.valid, false);
  if (!result.valid) assert.equal(result.code, "TOTAL_TOO_LARGE");
});

test("JPEG, PNG, and WebP MIME types are accepted", () => {
  for (const [name, type] of [
    ["photo.jpeg", "image/jpeg"],
    ["photo.png", "image/png"],
    ["photo.webp", "image/webp"],
  ]) {
    assert.deepEqual(validateInquiryImages([image(name, type)]), {
      valid: true,
    });
  }
});

test("GIF, HEIC, SVG, and PDF MIME types are rejected", () => {
  for (const [name, type] of [
    ["photo.gif", "image/gif"],
    ["photo.heic", "image/heic"],
    ["photo.svg", "image/svg+xml"],
    ["document.pdf", "application/pdf"],
  ]) {
    const result = validateInquiryImages([image(name, type)]);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.code, "UNSUPPORTED_TYPE");
  }
});

test("duplicate selections do not create duplicate files", () => {
  const first = image("same.jpg", "image/jpeg", 2048, 1234);
  const duplicate = image("same.jpg", "image/jpeg", 2048, 1234);
  const result = deduplicateInquiryImages([first, duplicate]);

  assert.deepEqual(result.files, [first]);
  assert.equal(result.duplicateCount, 1);
});
