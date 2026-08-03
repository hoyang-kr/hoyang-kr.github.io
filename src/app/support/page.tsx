import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { PageIntro } from "@/components/ui/page-intro";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "고객지원",
  description: "제품 자료, 설치, 관리와 구매 관련 안내를 확인하세요.",
  alternates: {
    canonical: "/support",
  },
};

const supportSections = [
  {
    id: "installation",
    title: "설치 안내",
    description: siteConfig.customerPolicy.installationResponsibilityStatement,
    action: "설치 문의",
    href: "/contact?topic=installation",
  },
  {
    id: "care",
    title: "제품 관리",
    description: siteConfig.customerPolicy.productCareSummary,
    action: "관리 문의",
    href: "/contact?topic=care",
  },
  {
    id: "warranty",
    title: "보증",
    description: siteConfig.customerPolicy.warrantySummary,
    action: "보증 문의",
    href: "/contact?topic=warranty",
  },
  {
    id: "service",
    title: "A/S",
    description: siteConfig.customerPolicy.asPolicySummary,
    action: "A/S 문의",
    href: "/contact?topic=service",
  },
  {
    id: "returns",
    title: "교환 및 반품",
    description: siteConfig.customerPolicy.returnExchangeSummary,
    action: "정책 문의",
    href: "/contact?topic=returns",
  },
  {
    id: "delivery",
    title: "배송",
    description: siteConfig.customerPolicy.deliveryInformationSummary,
    action: "배송 문의",
    href: "/contact?topic=delivery",
  },
  {
    id: "wholesale",
    title: "대량 구매·프로젝트 납품",
    description:
      "도매, 대량 구매와 프로젝트 납품은 검증된 전용 연락처 또는 고객센터를 통해 문의할 수 있습니다.",
    action: "납품 문의",
    href: "/contact?topic=bulk",
  },
];

export default function SupportPage() {
  return (
    <>
      <PageIntro
        breadcrumb="고객지원"
        description="제품을 고르고 설치하고 관리하는 데 필요한 정보를 한곳에서 확인하세요."
        eyebrow="Product support"
        title="무엇을 도와드릴까요?"
        titleClassName="text-2xl leading-tight font-medium tracking-[-0.04em] text-balance md:text-4xl"
      />

      <section className="page-shell pb-24 md:pb-32">
        <div className="border-t border-line">
          {supportSections.map((section, index) => (
            <article
              className="grid gap-5 border-b border-line py-9 md:grid-cols-[4rem_1fr_12rem] md:items-center md:py-12"
              id={section.id}
              key={section.id}
            >
              <span className="text-[10px] tracking-[0.12em] text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-xl font-medium">{section.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                  {section.description}
                </p>
              </div>
              <Link
                className="text-link w-fit md:justify-self-end"
                href={section.href}
              >
                {section.action}
                <ArrowRightIcon className="size-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-8 bg-stone p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <h2 className="text-xl font-medium">문의 전 준비 사항</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {siteConfig.customerPolicy.customerSupportInstructions}
            </p>
          </div>
          <Link className="button-secondary" href="/contact?topic=service">
            고객센터 문의
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-muted">
          고객센터: {siteConfig.telephone}
        </p>
      </section>
    </>
  );
}
