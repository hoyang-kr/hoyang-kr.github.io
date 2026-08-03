"use client";

import Link from "next/link";

import { ExternalIcon } from "@/components/icons";
import type { NaverListingStatus } from "@/config/launch-schema";
import { trackOutboundClick } from "@/lib/outbound";

type NaverStoreButtonProps = {
  url?: string;
  listingStatus: NaverListingStatus;
  productName: string;
  inquiryHref: string;
  className?: string;
};

export function NaverStoreButton({
  url,
  listingStatus,
  productName,
  inquiryHref,
  className = "",
}: NaverStoreButtonProps) {
  if (listingStatus === "inquiry-only") {
    return (
      <Link
        className={`button-secondary min-h-13 ${className}`}
        href={inquiryHref}
      >
        제품 구매 문의하기
      </Link>
    );
  }

  if (listingStatus !== "active" || !url) {
    const labels: Record<Exclude<NaverListingStatus, "active">, string> = {
      inactive: "현재 판매하지 않음",
      "coming-soon": "판매 준비 중",
      "inquiry-only": "제품 구매 문의하기",
      unverified: "판매 링크 확인 중",
    };

    return (
      <span
        aria-disabled="true"
        className={`flex min-h-13 cursor-not-allowed items-center justify-center border border-line bg-stone px-5 text-sm font-semibold text-muted ${className}`}
      >
        {listingStatus === "active"
          ? "판매 링크 검증 필요"
          : labels[listingStatus]}
      </span>
    );
  }

  return (
    <a
      className={`button-naver min-h-13 ${className}`}
      href={url}
      onClick={() => trackOutboundClick(productName, url)}
      rel="noopener noreferrer"
      target="_blank"
    >
      네이버 스마트스토어에서 구매하기
      <ExternalIcon className="size-4" />
    </a>
  );
}
