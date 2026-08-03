export const MAX_INQUIRY_IMAGES = 3;
export const MAX_INQUIRY_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_INQUIRY_TOTAL_IMAGE_BYTES =
  MAX_INQUIRY_IMAGES * MAX_INQUIRY_IMAGE_BYTES;

export const ALLOWED_INQUIRY_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type InquiryImageFileLike = {
  name: string;
  size: number;
  type: string;
};

export type InquiryImageValidationCode =
  | "TOO_MANY_IMAGES"
  | "IMAGE_TOO_LARGE"
  | "TOTAL_TOO_LARGE"
  | "UNSUPPORTED_TYPE";

export type InquiryImageValidationResult =
  | { valid: true }
  | {
      valid: false;
      code: InquiryImageValidationCode;
      message: string;
    };

export function validateInquiryImages(
  files: readonly InquiryImageFileLike[],
): InquiryImageValidationResult {
  if (files.length > MAX_INQUIRY_IMAGES) {
    return {
      valid: false,
      code: "TOO_MANY_IMAGES",
      message: "이미지는 최대 3장까지 첨부할 수 있습니다.",
    };
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_INQUIRY_TOTAL_IMAGE_BYTES) {
    return {
      valid: false,
      code: "TOTAL_TOO_LARGE",
      message: "첨부 이미지의 전체 크기는 15MB 이하여야 합니다.",
    };
  }

  if (files.some((file) => file.size > MAX_INQUIRY_IMAGE_BYTES)) {
    return {
      valid: false,
      code: "IMAGE_TOO_LARGE",
      message: "이미지 한 장의 크기는 5MB 이하여야 합니다.",
    };
  }

  const allowedTypes = new Set<string>(ALLOWED_INQUIRY_IMAGE_TYPES);
  if (files.some((file) => !allowedTypes.has(file.type))) {
    return {
      valid: false,
      code: "UNSUPPORTED_TYPE",
      message: "JPG, PNG 또는 WebP 이미지만 첨부할 수 있습니다.",
    };
  }

  return { valid: true };
}

export type InquiryImageIdentity = InquiryImageFileLike & {
  lastModified: number;
};

export function inquiryImageKey(file: InquiryImageIdentity) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function deduplicateInquiryImages<T extends InquiryImageIdentity>(
  files: readonly T[],
) {
  const keys = new Set<string>();
  const uniqueFiles: T[] = [];
  let duplicateCount = 0;

  for (const file of files) {
    const key = inquiryImageKey(file);
    if (keys.has(key)) {
      duplicateCount += 1;
      continue;
    }
    keys.add(key);
    uniqueFiles.push(file);
  }

  return { files: uniqueFiles, duplicateCount };
}
