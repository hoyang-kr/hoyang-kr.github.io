import type { Metadata } from "next";

import { CompanyLegalDetails } from "@/components/legal/company-legal-details";
import { PageIntro } from "@/components/ui/page-intro";
import { isPreviewRelease } from "@/config/launch-data";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "이용약관",
  description:
    siteConfig.legal.termsStatus === "final"
      ? "웹사이트 이용약관입니다."
      : "웹사이트 이용약관 초안입니다.",
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: !isPreviewRelease && siteConfig.legal.termsStatus === "final",
  },
};

export default function TermsPage() {
  const isDraft = isPreviewRelease || siteConfig.legal.termsStatus !== "final";

  return (
    <>
      <PageIntro
        breadcrumb="이용약관"
        description={
          isDraft
            ? "아래 내용은 운영 전 법률 및 사업자 검토가 필요한 초안입니다."
            : `시행일 ${siteConfig.legal.termsEffectiveDate}`
        }
        eyebrow={isDraft ? "Legal draft" : "Terms of use"}
        title="이용약관"
      />
      <article className="legal-copy page-shell max-w-4xl pb-24 md:pb-32">
        {isDraft ? (
          <>
            <div className="border border-line bg-stone p-5 text-sm leading-6">
              이 문서는 카탈로그 웹사이트를 위한 템플릿 초안입니다. 판매 계약은
              연결된 네이버 스마트스토어에서 이루어지므로 해당 판매 채널의
              약관과 사업자 정책을 함께 검토해야 합니다.
            </div>

            <h2>검토가 필요한 항목</h2>
            <p>
              사이트 역할, 제품 정보 책임 범위, 외부 판매 서비스, 지식재산권,
              고객 문의, 준거 정책과 시행일을 법률 및 사업자 검토 후 중앙 launch
              data에 입력해야 합니다.
            </p>

            <h2>현재 사이트 동작</h2>
            <p>
              이 사이트는 장바구니, 결제, 회원 계정 또는 주문 관리 기능을
              제공하지 않습니다. 판매 링크가 검증된 제품만 외부 네이버 판매
              페이지로 연결됩니다.
            </p>
          </>
        ) : (
          <>
            {siteConfig.legal.termsSections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p className="whitespace-pre-line">{section.body}</p>
              </section>
            ))}
            <CompanyLegalDetails />
            <h2>시행일</h2>
            <p>{siteConfig.legal.termsEffectiveDate}</p>
          </>
        )}
      </article>
    </>
  );
}
