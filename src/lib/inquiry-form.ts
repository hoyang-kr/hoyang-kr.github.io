import { collections } from "@/data/collections";
import { products } from "@/data/products";
import type { InquiryType, InquiryValues } from "@/types/inquiry";

export const topicMap: Record<string, InquiryType> = {
  product: "구매 전 제품 문의",
  bulk: "대량 구매 및 납품",
  installation: "설치 문의",
  service: "A/S 및 보증",
  returns: "교환 및 반품",
};
export const purchaseRequiredTypes: InquiryType[] = [
  "주문 및 배송",
  "A/S 및 보증",
  "교환 및 반품",
];
export const productRequiredTypes: InquiryType[] = [
  "구매 전 제품 문의",
  ...purchaseRequiredTypes,
  "설치 문의",
];
export const catalogProducts = products.filter(
  (p) =>
    p.customerVisible &&
    p.collection &&
    p.variants.some((v) => v.customerVisible && v.finish !== "미확인"),
);
export const validVariants = (productId: string) =>
  catalogProducts
    .find((p) => p.id === productId)
    ?.variants.filter((v) => v.customerVisible && v.finish !== "미확인") ?? [];
export function prefillInquiry(
  topic: string | null,
  productValue: string | null,
): Pick<InquiryValues, "inquiryType" | "collectionId" | "productId"> {
  const product = productValue
    ? catalogProducts.find(
        (p) =>
          p.nameKo === productValue ||
          p.id === productValue ||
          p.slug === productValue,
      )
    : undefined;
  return {
    inquiryType: (topic && topicMap[topic]) || "",
    collectionId: product?.collection ?? "",
    productId: product?.id ?? "",
  };
}
export function validateInquiry(values: InquiryValues) {
  const errors: Partial<Record<keyof InquiryValues, string>> = {};
  if (!values.inquiryType) errors.inquiryType = "문의 유형을 선택해 주세요.";
  if (!values.customerName.trim())
    errors.customerName = "이름을 입력해 주세요.";
  if (!/^\S+@\S+\.\S+$/.test(values.customerEmail.trim()))
    errors.customerEmail = "올바른 이메일을 입력해 주세요.";
  const purchaseRequired =
    values.inquiryType && purchaseRequiredTypes.includes(values.inquiryType);
  if (purchaseRequired && !values.purchaseSource)
    errors.purchaseSource = "구매처를 선택해 주세요.";
  if (purchaseRequired && !values.purchaseId.trim())
    errors.purchaseId = "구매번호를 입력해 주세요.";
  if (purchaseRequired && !values.purchaseDate)
    errors.purchaseDate = "구매일을 입력해 주세요.";
  if (
    values.purchaseDate &&
    values.purchaseDate > new Date().toISOString().slice(0, 10)
  )
    errors.purchaseDate = "미래 날짜는 선택할 수 없습니다.";
  if (
    values.inquiryType &&
    productRequiredTypes.includes(values.inquiryType) &&
    !values.productId
  )
    errors.productId = "제품을 선택해 주세요.";
  const message = values.message.trim();
  if (message.length < 20)
    errors.message = "문의 내용을 20자 이상 입력해 주세요.";
  if (!values.privacyConsent)
    errors.privacyConsent = "개인정보 수집 및 이용 동의가 필요합니다.";
  return errors;
}
export { collections };
