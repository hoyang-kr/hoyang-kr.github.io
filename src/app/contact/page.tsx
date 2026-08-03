import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { InquiryForm } from "@/components/contact/inquiry-form";
import { PageIntro } from "@/components/ui/page-intro";
import { isPlaceholderValue } from "@/config/launch-data";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "제품, 주문, 설치와 고객지원 문의를 접수합니다.",
  alternates: { canonical: "/contact" },
};
export default function ContactPage() {
  const emailReady = !isPlaceholderValue(siteConfig.email);
  const phoneReady = !isPlaceholderValue(siteConfig.telephone);
  return (
    <>
      <PageIntro
        breadcrumb="문의"
        description="문의 내용을 남겨주시면 확인 후 이메일로 답변드립니다."
        eyebrow="Contact"
        title="제품과 납품에 대해 문의하세요."
        titleClassName="text-2xl leading-tight font-medium tracking-[-0.04em] text-balance md:text-4xl"
      />
      <section className="page-shell grid gap-12 pb-24 md:pb-32 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20">
        <Suspense fallback={<div className="min-h-96" />}>
          <InquiryForm />
        </Suspense>
        <aside className="self-start bg-stone p-7 md:p-10">
          <p className="eyebrow-section mb-8">Contact information</p>
          <dl className="space-y-7 text-sm">
            {phoneReady && (
              <div>
                <dt className="text-xs text-muted">고객센터</dt>
                <dd className="mt-2 text-lg font-medium">
                  <a href={`tel:${siteConfig.telephone}`}>
                    {siteConfig.telephone}
                  </a>
                </dd>
              </div>
            )}
            {emailReady && (
              <div>
                <dt className="text-xs text-muted">이메일</dt>
                <dd className="mt-2 text-lg font-medium">
                  <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted">사업장 주소</dt>
              <dd className="mt-2 leading-6">{siteConfig.address}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">운영 시간</dt>
              <dd className="mt-2 leading-6">{siteConfig.operatingHours}</dd>
            </div>
          </dl>
          <Link className="text-link mt-8" href="/support">
            고객지원 안내 보기
          </Link>
        </aside>
      </section>
    </>
  );
}
