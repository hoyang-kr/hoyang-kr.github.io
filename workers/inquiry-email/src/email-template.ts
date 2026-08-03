import { Buffer } from "node:buffer";
import type { InquiryPayload, ValidatedAttachment } from "./validation";

export type ResendEmailRequest = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
};

type EmailRow = {
  label: string;
  value: string;
  optional?: boolean;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildInquirySubject(payload: InquiryPayload) {
  const productName = payload.productName.replace(/[\r\n]+/g, " ").trim();
  return `[HOYANG 문의] ${payload.inquiryType}${
    productName ? ` · ${productName}` : ""
  }`;
}

function emailRows(payload: InquiryPayload, attachmentCount: number) {
  const rows: EmailRow[] = [
    { label: "접수 ID", value: payload.submissionId },
    { label: "문의 유형", value: payload.inquiryType },
    { label: "이름", value: payload.customerName },
    { label: "답변받을 이메일", value: payload.customerEmail },
    { label: "전화번호", value: payload.customerPhone, optional: true },
    { label: "구매처", value: payload.purchaseSource, optional: true },
    {
      label: "구매번호 / 주문번호",
      value: payload.purchaseId,
      optional: true,
    },
    { label: "구매일", value: payload.purchaseDate, optional: true },
    { label: "컬렉션", value: payload.collectionName, optional: true },
    { label: "제품", value: payload.productName, optional: true },
    { label: "모델 번호", value: payload.modelNumber, optional: true },
    { label: "마감", value: payload.finish, optional: true },
    { label: "문의 내용", value: payload.message },
    { label: "접수 시각", value: payload.submittedAt },
    { label: "접수 페이지", value: payload.pageUrl },
    { label: "첨부 이미지 수", value: String(attachmentCount) },
  ];

  return rows.filter((row) => !row.optional || row.value.trim());
}

export function buildInquiryEmail(
  payload: InquiryPayload,
  attachmentCount: number,
) {
  const rows = emailRows(payload, attachmentCount);
  const htmlRows = rows
    .map(({ label, value }) => {
      const escapedValue = escapeHtml(value).replaceAll("\n", "<br>");
      return `<tr><th style="padding:10px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #e5e1dc;width:170px;color:#4f4a45;font-weight:600">${escapeHtml(label)}</th><td style="padding:10px 12px;vertical-align:top;border-bottom:1px solid #e5e1dc;white-space:normal;word-break:break-word">${escapedValue}</td></tr>`;
    })
    .join("");
  const text = rows
    .map(({ label, value }) => `${label}: ${value}`)
    .join("\n\n");

  return {
    subject: buildInquirySubject(payload),
    html: `<!doctype html><html lang="ko"><body style="margin:0;padding:24px;background:#f7f5f2;color:#24211e;font-family:Arial,'Noto Sans KR',sans-serif"><div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e1dc"><div style="padding:20px 24px;background:#24211e;color:#ffffff"><h1 style="margin:0;font-size:20px">HOYANG 문의 접수</h1></div><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px"><tbody>${htmlRows}</tbody></table></div></body></html>`,
    text,
  };
}

export async function buildResendEmailRequest({
  from,
  to,
  payload,
  attachments,
}: {
  from: string;
  to: string;
  payload: InquiryPayload;
  attachments: readonly ValidatedAttachment[];
}): Promise<ResendEmailRequest> {
  const email = buildInquiryEmail(payload, attachments.length);
  const encodedAttachments = await Promise.all(
    attachments.map(async ({ file, filename }) => ({
      filename,
      content: Buffer.from(await file.arrayBuffer()).toString("base64"),
    })),
  );

  return {
    from,
    to: [to],
    reply_to: payload.customerEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(encodedAttachments.length ? { attachments: encodedAttachments } : {}),
  };
}
