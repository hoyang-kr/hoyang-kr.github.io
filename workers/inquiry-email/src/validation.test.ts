import { describe, expect, it, vi } from "vitest";
import {
  buildInquiryEmail,
  buildResendEmailRequest,
  escapeHtml,
  type ResendEmailRequest,
} from "./email-template";
import worker, { sendResendEmail, type Env } from "./index";
import {
  isAllowedOrigin,
  MAX_INQUIRY_IMAGE_BYTES,
  parseAllowedOrigins,
  parseInquiryPayload,
  sanitizeAttachmentFilename,
  validateAttachments,
  type AttachmentFile,
  type InquiryPayload,
} from "./validation";

const origin = "https://hoyang.co.kr";
const allowedOrigins = parseAllowedOrigins(
  "https://hoyang.co.kr,https://www.hoyang.co.kr",
);
const workerEnv: Env = {
  ALLOWED_ORIGINS: allowedOrigins.join(","),
  INQUIRY_FROM_EMAIL: "HOYANG 문의 <inquiry@send.hoyang.co.kr>",
  RESEND_API_KEY: "test-key",
  INQUIRY_TO_EMAIL: "destination@example.com",
};

const validPayload = (): InquiryPayload => ({
  submissionId: "123e4567-e89b-42d3-a456-426614174000",
  subject: "[HOYANG 문의] 기타 문의",
  inquiryType: "기타 문의",
  customerName: "홍길동",
  customerEmail: "customer@example.com",
  customerPhone: "",
  purchaseSource: "",
  purchaseId: "",
  purchaseDate: "",
  collectionId: "",
  collectionName: "",
  productId: "",
  productName: "",
  variantId: "",
  modelNumber: "",
  finish: "",
  message: "제품 설치 환경에 관하여 자세한 상담을 요청드립니다.",
  submittedAt: "2026-08-03T12:00:00.000Z",
  pageUrl: "https://hoyang.co.kr/contact",
  privacyConsent: true,
  website: "",
});

const parse = (payload: Record<string, unknown> | InquiryPayload) =>
  parseInquiryPayload(JSON.stringify(payload), allowedOrigins, origin);

const attachment = (
  name: string,
  type: string,
  bytes: number[],
  reportedSize?: number,
): AttachmentFile => {
  const data = Uint8Array.from(bytes);
  return {
    name,
    type,
    size: reportedSize ?? data.byteLength,
    arrayBuffer: async () =>
      data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength,
      ) as ArrayBuffer,
  };
};

const jpeg = () =>
  attachment("photo.jpg", "image/jpeg", [0xff, 0xd8, 0xff, 0xe0]);
const png = () =>
  attachment(
    "photo.png",
    "image/png",
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
const webp = () =>
  attachment(
    "photo.webp",
    "image/webp",
    [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
  );

describe("origin and payload validation", () => {
  it("allows only configured origins", () => {
    expect(isAllowedOrigin(origin, allowedOrigins)).toBe(true);
    expect(isAllowedOrigin("https://attacker.example", allowedOrigins)).toBe(
      false,
    );
    expect(isAllowedOrigin(null, allowedOrigins)).toBe(false);
  });

  it("rejects invalid JSON", () => {
    expect(parseInquiryPayload("{", allowedOrigins, origin)).toMatchObject({
      ok: false,
      status: 400,
      code: "INVALID_SUBMISSION",
    });
  });

  it("rejects missing privacy consent", () => {
    const payload = { ...validPayload() } as Record<string, unknown>;
    delete payload.privacyConsent;
    expect(parse(payload)).toMatchObject({
      ok: false,
      logCode: "PRIVACY_CONSENT",
    });
  });

  it("rejects a triggered honeypot with 403", () => {
    expect(parse({ ...validPayload(), website: "spam" })).toMatchObject({
      ok: false,
      status: 403,
      logCode: "HONEYPOT",
    });
  });

  it("rejects an invalid email", () => {
    expect(
      parse({ ...validPayload(), customerEmail: "not-an-email" }),
    ).toMatchObject({ ok: false, logCode: "CUSTOMER_EMAIL" });
  });

  it("rejects a short message", () => {
    expect(parse({ ...validPayload(), message: "짧은 문의" })).toMatchObject({
      ok: false,
      logCode: "MESSAGE_LENGTH",
    });
  });
});

describe("Worker CORS", () => {
  it("returns exact CORS headers for an allowed preflight origin", async () => {
    const response = await worker.fetch(
      new Request("https://worker.example/inquiry", {
        method: "OPTIONS",
        headers: { Origin: origin },
      }),
      workerEnv,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "POST, OPTIONS",
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type, Accept",
    );
    expect(response.headers.get("Vary")).toBe("Origin");
  });

  it("rejects a disallowed POST origin without a wildcard CORS header", async () => {
    const response = await worker.fetch(
      new Request("https://worker.example/inquiry", {
        method: "POST",
        headers: { Origin: "https://attacker.example" },
      }),
      workerEnv,
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(await response.json()).toEqual({
      ok: false,
      code: "INVALID_SUBMISSION",
    });
  });
});

describe("attachment validation", () => {
  it("rejects more than three files", async () => {
    expect(
      await validateAttachments([jpeg(), jpeg(), jpeg(), jpeg()]),
    ).toMatchObject({
      ok: false,
      status: 400,
      logCode: "ATTACHMENT_COUNT",
    });
  });

  it("rejects an oversized file", async () => {
    const oversized = attachment(
      "large.jpg",
      "image/jpeg",
      [0xff, 0xd8, 0xff],
      MAX_INQUIRY_IMAGE_BYTES + 1,
    );
    expect(await validateAttachments([oversized])).toMatchObject({
      ok: false,
      status: 413,
      code: "ATTACHMENT_TOO_LARGE",
    });
  });

  it("rejects an invalid MIME type", async () => {
    const gif = attachment("photo.gif", "image/gif", [0x47, 0x49, 0x46, 0x38]);
    expect(await validateAttachments([gif])).toMatchObject({
      ok: false,
      code: "UNSUPPORTED_ATTACHMENT",
      logCode: "ATTACHMENT_MIME",
    });
  });

  it.each([
    ["JPEG", jpeg],
    ["PNG", png],
    ["WebP", webp],
  ])("accepts a valid %s signature", async (_label, createFile) => {
    expect(await validateAttachments([createFile()])).toMatchObject({
      ok: true,
    });
  });

  it("rejects a MIME and signature mismatch", async () => {
    const mismatch = attachment(
      "renamed.jpg",
      "image/jpeg",
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    );
    expect(await validateAttachments([mismatch])).toMatchObject({
      ok: false,
      code: "UNSUPPORTED_ATTACHMENT",
      logCode: "ATTACHMENT_SIGNATURE",
    });
  });

  it("sanitizes attachment filenames and supplies a fallback", () => {
    const sanitized = sanitizeAttachmentFilename(
      "../폴더\\photo<script>.jpeg",
      "image/jpeg",
      0,
    );
    expect(sanitized).toMatch(/\.jpeg$/);
    expect(sanitized).not.toMatch(/[\\/<>\u0000-\u001f]/);
    expect(sanitized.length).toBeLessThanOrEqual(120);
    expect(sanitizeAttachmentFilename("../../.jpeg", "image/jpeg", 0)).toBe(
      "attachment-1.jpeg",
    );
  });
});

describe("email generation and Resend delivery", () => {
  it("escapes customer-provided HTML", () => {
    expect(escapeHtml("<script>&</script>")).toBe(
      "&lt;script&gt;&amp;&lt;/script&gt;",
    );
    const email = buildInquiryEmail(
      { ...validPayload(), message: "<img src=x onerror=alert(1)>" },
      0,
    );
    expect(email.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(email.html).not.toContain("<img src=x");
  });

  it("omits empty optional fields from the email", () => {
    const email = buildInquiryEmail(validPayload(), 0);
    expect(email.html).not.toContain("전화번호");
    expect(email.html).not.toContain("구매번호 / 주문번호");
    expect(email.html).toContain("첨부 이미지 수");
  });

  it("sets reply_to and Base64-encodes attachments with sanitized names", async () => {
    const validated = await validateAttachments([
      attachment("photo<script>.jpg", "image/jpeg", [0xff, 0xd8, 0xff, 0xe0]),
    ]);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const request = await buildResendEmailRequest({
      from: "HOYANG 문의 <inquiry@send.hoyang.co.kr>",
      to: "private@example.com",
      payload: validPayload(),
      attachments: validated.attachments,
    });

    expect(request.reply_to).toBe("customer@example.com");
    expect(request.attachments).toEqual([
      {
        filename: "photoscript.jpg",
        content: "/9j/4A==",
      },
    ]);
  });

  it("calls the mocked Resend endpoint with the idempotency key", async () => {
    const email: ResendEmailRequest = {
      from: "HOYANG 문의 <inquiry@send.hoyang.co.kr>",
      to: ["private@example.com"],
      reply_to: "customer@example.com",
      subject: "[HOYANG 문의] 기타 문의",
      html: "<p>safe</p>",
      text: "safe",
    };
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return new Response(null, { status: 200 });
      },
    );

    const response = await sendResendEmail(
      email,
      "test_api_key",
      validPayload().submissionId,
      fetchMock,
    );

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(url).toBe("https://api.resend.com/emails");
    expect(headers.get("Authorization")).toBe("Bearer test_api_key");
    expect(headers.get("Idempotency-Key")).toBe(validPayload().submissionId);
    expect(JSON.parse(String(init?.body))).toMatchObject({
      reply_to: "customer@example.com",
    });
  });
});
