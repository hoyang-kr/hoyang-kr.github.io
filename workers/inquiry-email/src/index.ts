import {
  buildResendEmailRequest,
  type ResendEmailRequest,
} from "./email-template";
import {
  MAX_MULTIPART_REQUEST_BYTES,
  parseAllowedOrigins,
  parseInquiryPayload,
  validateAttachments,
  type AttachmentFile,
  type ValidationFailure,
} from "./validation";

export type Env = {
  ALLOWED_ORIGINS: string;
  INQUIRY_FROM_EMAIL: string;
  RESEND_API_KEY: string;
  INQUIRY_TO_EMAIL: string;
};

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function corsHeaders(origin: string | null, allowedOrigins: string[]) {
  const headers = new Headers({ Vary: "Origin" });
  if (origin && allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  }
  return headers;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
  allowedOrigins: string[],
) {
  const headers = corsHeaders(origin, allowedOrigins);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(
  failure: ValidationFailure,
  origin: string | null,
  allowedOrigins: string[],
) {
  return jsonResponse(
    { ok: false, code: failure.code },
    failure.status,
    origin,
    allowedOrigins,
  );
}

function logFailure(
  submissionId: string | undefined,
  status: number,
  code: string,
) {
  console.error(JSON.stringify({ submissionId, status, code }));
}

export async function sendResendEmail(
  email: ResendEmailRequest,
  apiKey: string,
  submissionId: string,
  fetcher: Fetcher = fetch,
) {
  return fetcher(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": submissionId,
    },
    body: JSON.stringify(email),
  });
}

function isAttachmentFile(value: FormDataEntryValue): value is File {
  return (
    typeof value !== "string" &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.type === "string" &&
    typeof value.arrayBuffer === "function"
  );
}

async function handleInquiry(
  request: Request,
  env: Env,
  requestOrigin: string,
  allowedOrigins: string[],
) {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (
    !/^multipart\/form-data\s*;/i.test(contentType) ||
    !/boundary=/i.test(contentType)
  ) {
    return jsonResponse(
      { ok: false, code: "INVALID_SUBMISSION" },
      400,
      requestOrigin,
      allowedOrigins,
    );
  }

  const contentLength = Number(request.headers.get("Content-Length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_MULTIPART_REQUEST_BYTES
  ) {
    return jsonResponse(
      { ok: false, code: "ATTACHMENT_TOO_LARGE" },
      413,
      requestOrigin,
      allowedOrigins,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse(
      { ok: false, code: "INVALID_SUBMISSION" },
      400,
      requestOrigin,
      allowedOrigins,
    );
  }

  const iterableFormData = formData as FormData & {
    entries(): IterableIterator<[string, FormDataEntryValue]>;
  };
  for (const [key] of iterableFormData.entries()) {
    if (key !== "payload" && key !== "images") {
      return jsonResponse(
        { ok: false, code: "INVALID_SUBMISSION" },
        400,
        requestOrigin,
        allowedOrigins,
      );
    }
  }

  const payloadEntries = formData.getAll("payload");
  if (payloadEntries.length !== 1 || typeof payloadEntries[0] !== "string") {
    return jsonResponse(
      { ok: false, code: "INVALID_SUBMISSION" },
      400,
      requestOrigin,
      allowedOrigins,
    );
  }

  const payloadResult = parseInquiryPayload(
    payloadEntries[0],
    allowedOrigins,
    requestOrigin,
  );
  if (!payloadResult.ok) {
    logFailure(undefined, payloadResult.status, payloadResult.logCode);
    return errorResponse(payloadResult, requestOrigin, allowedOrigins);
  }

  const submissionId = payloadResult.payload.submissionId;
  const rawAttachments = formData.getAll("images");
  if (!rawAttachments.every(isAttachmentFile)) {
    const failure: ValidationFailure = {
      ok: false,
      status: 400,
      code: "UNSUPPORTED_ATTACHMENT",
      logCode: "ATTACHMENT_SHAPE",
    };
    logFailure(submissionId, failure.status, failure.logCode);
    return errorResponse(failure, requestOrigin, allowedOrigins);
  }

  const attachmentResult = await validateAttachments(
    rawAttachments as AttachmentFile[],
  );
  if (!attachmentResult.ok) {
    logFailure(submissionId, attachmentResult.status, attachmentResult.logCode);
    return errorResponse(attachmentResult, requestOrigin, allowedOrigins);
  }

  if (!env.RESEND_API_KEY || !env.INQUIRY_TO_EMAIL || !env.INQUIRY_FROM_EMAIL) {
    logFailure(submissionId, 500, "WORKER_CONFIGURATION");
    return jsonResponse(
      { ok: false, code: "INTERNAL_ERROR" },
      500,
      requestOrigin,
      allowedOrigins,
    );
  }

  const email = await buildResendEmailRequest({
    from: env.INQUIRY_FROM_EMAIL,
    to: env.INQUIRY_TO_EMAIL,
    payload: payloadResult.payload,
    attachments: attachmentResult.attachments,
  });
  let resendResponse: Response;
  try {
    resendResponse = await sendResendEmail(
      email,
      env.RESEND_API_KEY,
      submissionId,
    );
  } catch {
    logFailure(submissionId, 502, "RESEND_REQUEST");
    return jsonResponse(
      { ok: false, code: "DELIVERY_FAILED" },
      502,
      requestOrigin,
      allowedOrigins,
    );
  }

  if (!resendResponse.ok) {
    logFailure(submissionId, 502, "RESEND_DELIVERY");
    return jsonResponse(
      { ok: false, code: "DELIVERY_FAILED" },
      502,
      requestOrigin,
      allowedOrigins,
    );
  }

  return jsonResponse(
    { ok: true, submissionId },
    200,
    requestOrigin,
    allowedOrigins,
  );
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS ?? "");
    const rawOrigin = request.headers.get("Origin");
    let normalizedOrigin: string | null = null;
    try {
      normalizedOrigin = rawOrigin ? new URL(rawOrigin).origin : null;
    } catch {
      normalizedOrigin = null;
    }

    if (url.pathname !== "/inquiry") {
      return jsonResponse(
        { ok: false, code: "NOT_FOUND" },
        404,
        normalizedOrigin,
        allowedOrigins,
      );
    }

    if (request.method !== "POST" && request.method !== "OPTIONS") {
      return jsonResponse(
        { ok: false, code: "METHOD_NOT_ALLOWED" },
        405,
        normalizedOrigin,
        allowedOrigins,
      );
    }

    if (!normalizedOrigin || !allowedOrigins.includes(normalizedOrigin)) {
      return jsonResponse(
        { ok: false, code: "INVALID_SUBMISSION" },
        403,
        normalizedOrigin,
        allowedOrigins,
      );
    }

    if (request.method === "OPTIONS") {
      return jsonResponse({ ok: true }, 200, normalizedOrigin, allowedOrigins);
    }

    try {
      return await handleInquiry(
        request,
        env,
        normalizedOrigin,
        allowedOrigins,
      );
    } catch {
      logFailure(undefined, 500, "UNEXPECTED_WORKER_ERROR");
      return jsonResponse(
        { ok: false, code: "INTERNAL_ERROR" },
        500,
        normalizedOrigin,
        allowedOrigins,
      );
    }
  },
} satisfies ExportedHandler<Env>;

export default worker;
