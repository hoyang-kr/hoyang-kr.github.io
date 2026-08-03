import type { Metadata } from "next";

import { CompanyLegalDetails } from "@/components/legal/company-legal-details";
import { PageIntro } from "@/components/ui/page-intro";
import { isPreviewRelease } from "@/config/launch-data";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    siteConfig.legal.privacyPolicyStatus === "final"
      ? "개인정보처리방침입니다."
      : "개인정보처리방침 초안입니다.",
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index:
      !isPreviewRelease && siteConfig.legal.privacyPolicyStatus === "final",
  },
};

export default function PrivacyPage() {
  const isDraft =
    isPreviewRelease || siteConfig.legal.privacyPolicyStatus !== "final";

  return (
    <>
      <PageIntro
        breadcrumb="개인정보처리방침"
        description={
          isDraft
            ? "아래 내용은 운영 전 법률 및 사업자 검토가 필요한 초안입니다."
            : `시행일 ${siteConfig.legal.privacyPolicyEffectiveDate}`
        }
        eyebrow={isDraft ? "Legal draft" : "Privacy policy"}
        title="개인정보처리방침"
      />
      <article className="legal-copy page-shell max-w-4xl pb-24 md:pb-32">
        {isDraft ? (
          <>
            <div className="border border-line bg-stone p-5 text-sm leading-6">
              이 문서는 템플릿 초안이며 실제 수집 항목, 보유 기간, 처리 위탁,
              개인정보 보호책임자 정보를 확정한 뒤 게시해야 합니다.
            </div>

            <h2>검토가 필요한 항목</h2>
            <p>
              실제 문의 채널, 수집 항목, 처리 목적, 보유 기간, 제3자 제공, 처리
              위탁, 이용자 권리, 개인정보 보호책임자와 시행일을 법률 및 사업자
              검토 후 중앙 launch data에 입력해야 합니다.
            </p>

            <h2>현재 사이트 동작</h2>
            <p>
              현재 웹사이트에는 문의 폼, 회원가입, 결제 또는 주문 관리 기능이
              없습니다. 문의는 검증된 전화 또는 이메일 링크를 통해 외부에서
              진행됩니다.
            </p>
          </>
        ) : (
          <>
            {siteConfig.legal.privacyPolicySections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p className="whitespace-pre-line">{section.body}</p>
              </section>
            ))}
            <CompanyLegalDetails />
            <h2>시행일</h2>
            <p>{siteConfig.legal.privacyPolicyEffectiveDate}</p>
          </>
        )}
      </article>
    </>
  );
}
