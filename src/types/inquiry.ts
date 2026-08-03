export const inquiryTypes = [
  "구매 전 제품 문의",
  "주문 및 배송",
  "설치 문의",
  "A/S 및 보증",
  "교환 및 반품",
  "대량 구매 및 납품",
  "기타 문의",
] as const;
export type InquiryType = (typeof inquiryTypes)[number];
export type InquiryValues = {
  inquiryType: InquiryType | "";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  purchaseSource: string;
  purchaseId: string;
  purchaseDate: string;
  collectionId: string;
  productId: string;
  variantId: string;
  message: string;
  privacyConsent: boolean;
  website: string;
};
