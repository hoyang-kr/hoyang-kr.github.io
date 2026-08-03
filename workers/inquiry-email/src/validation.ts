export const MAX_INQUIRY_IMAGES = 3;
export const MAX_INQUIRY_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_INQUIRY_TOTAL_IMAGE_BYTES =
  MAX_INQUIRY_IMAGES * MAX_INQUIRY_IMAGE_BYTES;
export const MAX_MULTIPART_REQUEST_BYTES =
  MAX_INQUIRY_TOTAL_IMAGE_BYTES + 1024 * 1024;
export const MAX_PAYLOAD_TEXT_LENGTH = 32 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const INQUIRY_TYPES = [
  "구매 전 제품 문의",
  "주문 및 배송",
  "설치 문의",
  "A/S 및 보증",
  "교환 및 반품",
  "대량 구매 및 납품",
  "기타 문의",
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

export type InquiryPayload = {
  submissionId: string;
  subject: string;
  inquiryType: InquiryType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  purchaseSource: string;
  purchaseId: string;
  purchaseDate: string;
  collectionId: string;
  collectionName: string;
  productId: string;
  productName: string;
  variantId: string;
  modelNumber: string;
  finish: string;
  message: string;
  submittedAt: string;
  pageUrl: string;
  privacyConsent: true;
  website: "";
};

export type AttachmentFile = {
  name: string;
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type ValidatedAttachment = {
  file: AttachmentFile;
  filename: string;
};

export type PublicErrorCode =
  "INVALID_SUBMISSION" | "ATTACHMENT_TOO_LARGE" | "UNSUPPORTED_ATTACHMENT";

export type ValidationFailure = {
  ok: false;
  status: 400 | 403 | 413;
  code: PublicErrorCode;
  logCode: string;
};

export type PayloadValidationResult =
  { ok: true; payload: InquiryPayload } | ValidationFailure;

export type AttachmentValidationResult =
  { ok: true; attachments: ValidatedAttachment[] } | ValidationFailure;

const invalid = (logCode: string): ValidationFailure => ({
  ok: false,
  status: 400,
  code: "INVALID_SUBMISSION",
  logCode,
});

const purchaseRequiredTypes = new Set<InquiryType>([
  "주문 및 배송",
  "A/S 및 보증",
  "교환 및 반품",
]);

const productRequiredTypes = new Set<InquiryType>([
  "구매 전 제품 문의",
  "주문 및 배송",
  "설치 문의",
  "A/S 및 보증",
  "교환 및 반품",
]);

const stringLimits = {
  submissionId: 64,
  subject: 200,
  inquiryType: 40,
  customerName: 80,
  customerEmail: 254,
  customerPhone: 30,
  purchaseSource: 100,
  purchaseId: 100,
  purchaseDate: 10,
  collectionId: 100,
  collectionName: 160,
  productId: 100,
  productName: 160,
  variantId: 100,
  modelNumber: 100,
  finish: 100,
  message: 3000,
  submittedAt: 40,
  pageUrl: 2048,
  website: 200,
} as const;

const expectedPayloadKeys = new Set([
  ...Object.keys(stringLimits),
  "privacyConsent",
]);

export function parseAllowedOrigins(value: string) {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

export function isAllowedOrigin(
  origin: string | null,
  allowedOrigins: string[],
) {
  if (!origin) return false;
  try {
    return allowedOrigins.includes(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function parseInquiryPayload(
  rawPayload: unknown,
  allowedOrigins: string[],
  requestOrigin: string,
): PayloadValidationResult {
  if (
    typeof rawPayload !== "string" ||
    rawPayload.length === 0 ||
    rawPayload.length > MAX_PAYLOAD_TEXT_LENGTH
  ) {
    return invalid("PAYLOAD_SIZE");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    return invalid("PAYLOAD_JSON");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return invalid("PAYLOAD_SHAPE");
  }

  const value = parsed as Record<string, unknown>;
  if (Object.keys(value).some((key) => !expectedPayloadKeys.has(key))) {
    return invalid("UNEXPECTED_FIELD");
  }

  for (const [key, limit] of Object.entries(stringLimits)) {
    const field = value[key];
    if (typeof field !== "string" || field.length > limit) {
      return invalid(`INVALID_${key.toUpperCase()}`);
    }
  }

  if (value.privacyConsent !== true) {
    return invalid("PRIVACY_CONSENT");
  }

  if ((value.website as string).trim()) {
    return {
      ok: false,
      status: 403,
      code: "INVALID_SUBMISSION",
      logCode: "HONEYPOT",
    };
  }

  const submissionId = value.submissionId as string;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      submissionId,
    )
  ) {
    return invalid("SUBMISSION_ID");
  }

  const inquiryType = value.inquiryType as string;
  if (!INQUIRY_TYPES.includes(inquiryType as InquiryType)) {
    return invalid("INQUIRY_TYPE");
  }

  const customerName = (value.customerName as string).trim();
  if (!customerName) return invalid("CUSTOMER_NAME");

  const customerEmail = (value.customerEmail as string).trim();
  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) {
    return invalid("CUSTOMER_EMAIL");
  }

  const message = (value.message as string).trim();
  if (message.length < 20) return invalid("MESSAGE_LENGTH");

  const typedInquiryType = inquiryType as InquiryType;
  if (
    purchaseRequiredTypes.has(typedInquiryType) &&
    (!(value.purchaseSource as string).trim() ||
      !(value.purchaseId as string).trim() ||
      !(value.purchaseDate as string).trim())
  ) {
    return invalid("PURCHASE_INFORMATION");
  }

  const purchaseDate = value.purchaseDate as string;
  if (
    purchaseDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate) ||
      Number.isNaN(Date.parse(`${purchaseDate}T00:00:00Z`)) ||
      purchaseDate > new Date().toISOString().slice(0, 10))
  ) {
    return invalid("PURCHASE_DATE");
  }

  if (
    productRequiredTypes.has(typedInquiryType) &&
    (!(value.collectionId as string).trim() ||
      !(value.collectionName as string).trim() ||
      !(value.productId as string).trim() ||
      !(value.productName as string).trim())
  ) {
    return invalid("PRODUCT_INFORMATION");
  }

  if (Number.isNaN(Date.parse(value.submittedAt as string))) {
    return invalid("SUBMITTED_AT");
  }

  let pageOrigin = "";
  try {
    pageOrigin = new URL(value.pageUrl as string).origin;
  } catch {
    return invalid("PAGE_URL");
  }

  if (
    !allowedOrigins.includes(pageOrigin) ||
    pageOrigin !== new URL(requestOrigin).origin
  ) {
    return invalid("PAGE_ORIGIN");
  }

  return {
    ok: true,
    payload: {
      submissionId,
      subject: value.subject as string,
      inquiryType: typedInquiryType,
      customerName,
      customerEmail,
      customerPhone: (value.customerPhone as string).trim(),
      purchaseSource: (value.purchaseSource as string).trim(),
      purchaseId: (value.purchaseId as string).trim(),
      purchaseDate,
      collectionId: (value.collectionId as string).trim(),
      collectionName: (value.collectionName as string).trim(),
      productId: (value.productId as string).trim(),
      productName: (value.productName as string).trim(),
      variantId: (value.variantId as string).trim(),
      modelNumber: (value.modelNumber as string).trim(),
      finish: (value.finish as string).trim(),
      message,
      submittedAt: value.submittedAt as string,
      pageUrl: value.pageUrl as string,
      privacyConsent: true,
      website: "",
    },
  };
}

const signatureMatches = (type: string, bytes: Uint8Array) => {
  if (type === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (type === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((byte, index) => bytes[index] === byte);
  }

  if (type === "image/webp") {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  return false;
};

const extensionForType = (type: string) => {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
};

export function sanitizeAttachmentFilename(
  filename: string,
  type: string,
  index: number,
) {
  const safeExtension = extensionForType(type);
  const cleaned = filename
    .normalize("NFKC")
    .replace(/[\\/\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const dot = cleaned.lastIndexOf(".");
  const providedExtension =
    dot >= 0 ? cleaned.slice(dot + 1).toLowerCase() : "";
  const baseWithNoExtension = dot > 0 ? cleaned.slice(0, dot) : cleaned;
  const base = baseWithNoExtension
    .replace(/[^\p{L}\p{N} _.-]+/gu, "")
    .replace(/^\.+|\.+$/g, "")
    .trim()
    .slice(0, 100);
  const validProvidedExtension =
    (type === "image/jpeg" && ["jpg", "jpeg"].includes(providedExtension)) ||
    providedExtension === safeExtension;
  const extension = validProvidedExtension ? providedExtension : safeExtension;

  const safeBase = /[\p{L}\p{N}]/u.test(base)
    ? base
    : `attachment-${index + 1}`;

  return `${safeBase}.${extension}`;
}

export async function validateAttachments(
  files: readonly AttachmentFile[],
): Promise<AttachmentValidationResult> {
  if (files.length > MAX_INQUIRY_IMAGES) {
    return invalid("ATTACHMENT_COUNT");
  }

  let totalBytes = 0;
  for (const file of files) {
    if (!Number.isSafeInteger(file.size) || file.size < 0) {
      return invalid("ATTACHMENT_SIZE");
    }
    totalBytes += file.size;
    if (file.size > MAX_INQUIRY_IMAGE_BYTES) {
      return {
        ok: false,
        status: 413,
        code: "ATTACHMENT_TOO_LARGE",
        logCode: "ATTACHMENT_SIZE",
      };
    }
  }

  if (totalBytes > MAX_INQUIRY_TOTAL_IMAGE_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "ATTACHMENT_TOO_LARGE",
      logCode: "ATTACHMENT_TOTAL_SIZE",
    };
  }

  const allowedTypes = new Set<string>(ALLOWED_IMAGE_TYPES);
  const attachments: ValidatedAttachment[] = [];
  for (const [index, file] of files.entries()) {
    if (!allowedTypes.has(file.type)) {
      return {
        ok: false,
        status: 400,
        code: "UNSUPPORTED_ATTACHMENT",
        logCode: "ATTACHMENT_MIME",
      };
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      return invalid("ATTACHMENT_READ");
    }

    if (bytes.byteLength !== file.size || !signatureMatches(file.type, bytes)) {
      return {
        ok: false,
        status: 400,
        code: "UNSUPPORTED_ATTACHMENT",
        logCode: "ATTACHMENT_SIGNATURE",
      };
    }

    attachments.push({
      file,
      filename: sanitizeAttachmentFilename(file.name, file.type, index),
    });
  }

  return { ok: true, attachments };
}
