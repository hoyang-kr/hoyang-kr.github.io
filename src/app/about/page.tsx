import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { PageIntro } from "@/components/ui/page-intro";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Brand",
  description: `${siteConfig.brandNameKo}의 브랜드 방향과 제품에 대한 생각을 소개합니다.`,
  alternates: {
    canonical: "/about",
  },
};

const principles = [
  {
    number: "01",
    title: "공간에 남는 디테일",
    description:
      "욕실의 전체 인상을 해치지 않으면서 필요한 역할을 분명하게 수행하는 제품을 지향합니다.",
  },
  {
    number: "02",
    title: "선택하기 쉬운 정보",
    description:
      "제품군, 마감, 모델과 제공 자료를 명료하게 정리해 비교하기 쉬운 카탈로그를 만듭니다.",
  },
  {
    number: "03",
    title: "오래 이어지는 관계",
    description:
      "제품을 고르는 순간부터 사용 중 필요한 지원까지 이어지는 소통을 중요하게 생각합니다.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        breadcrumb="브랜드"
        description={siteConfig.companyDescription}
        eyebrow="About us"
        title="제품과 공간 사이의 균형"
        titleClassName="text-2xl leading-tight font-medium tracking-[-0.04em] text-balance md:text-4xl"
      />

      <section className="page-shell pb-20 md:pb-32">
        <div className="relative aspect-[16/8] min-h-80 overflow-hidden bg-stone">
          <Image
            alt={siteConfig.heroImageAlt}
            className="object-cover"
            fill
            priority
            sizes="100vw"
            src={siteConfig.heroImagePath}
          />
        </div>
      </section>

      <section className="border-y border-line bg-stone py-20 md:py-28">
        <div className="page-shell grid gap-12 md:grid-cols-[0.7fr_1.3fr] md:gap-20">
          <p className="eyebrow-section">Our perspective</p>
          <div>
            <h2 className="max-w-3xl text-3xl leading-snug font-medium tracking-[-0.04em] md:text-4xl">
              제품의 형태와 마감, 확인 가능한 정보를 더 명료한 방식으로
              소개합니다.
            </h2>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 md:py-28">
        <p className="eyebrow-section mb-10">What matters</p>
        <div className="grid border-t border-line md:grid-cols-3">
          {principles.map((principle, index) => (
            <article
              className={`flex min-h-72 flex-col justify-between py-6 md:px-7 ${
                index > 0
                  ? "border-t border-line md:border-t-0 md:border-l"
                  : ""
              }`}
              key={principle.number}
            >
              <span className="text-[10px] text-muted">{principle.number}</span>
              <div>
                <h2 className="text-xl font-medium">{principle.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {principle.description}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 flex justify-end">
          <Link className="text-link" href="/products">
            제품 둘러보기
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
