import type { Metadata } from "next";

import { DealerFinder } from "@/components/dealers/dealer-finder";
import { PageIntro } from "@/components/ui/page-intro";
import { dealers } from "@/data/dealers";

export const metadata: Metadata = {
  title: "Official Dealers",
  description: "가까운 HOYANG 공식 대리점에서 제품을 확인하고 상담받아보세요.",
  alternates: { canonical: "/dealers" },
};

export default function DealersPage() {
  return (
    <>
      <PageIntro
        breadcrumb="공식 대리점"
        description="가까운 HOYANG 공식 대리점에서 제품을 직접 확인하고 상담받아보세요."
        eyebrow="Where to buy"
        title="공식 대리점"
        titleClassName="text-2xl leading-tight font-medium tracking-[-0.04em] text-balance md:text-4xl"
      />
      <div className="page-shell pb-20 md:pb-32">
        <p className="mb-14 border-l-2 border-brand bg-stone px-5 py-4 text-sm leading-6 text-muted md:mb-20">
          매장별 전시 제품과 영업시간은 다를 수 있으므로 방문 전 해당 대리점에
          확인해 주세요.
        </p>
        <DealerFinder dealers={dealers} />
      </div>
    </>
  );
}
