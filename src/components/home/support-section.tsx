import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";

const supportItems = [
  {
    number: "01",
    title: "제품 자료",
    description: "제품별 제공 문서와 도면을 확인할 수 있습니다.",
    href: "/support#documents",
  },
  {
    number: "02",
    title: "설치 및 관리",
    description: "설치 전 확인 사항과 제품 관리 안내를 살펴보세요.",
    href: "/support#installation",
  },
  {
    number: "03",
    title: "대리점 찾기",
    description: "가까운 공식 대리점에서 제품을 확인하고 상담받아보세요.",
    href: "/dealers",
  },
  {
    number: "04",
    title: "제품 문의",
    description: "제품 선택과 납품에 필요한 내용을 문의해 주세요.",
    href: "/contact",
  },
];

export function SupportSection() {
  return (
    <div className="grid border-t border-line md:grid-cols-2 lg:grid-cols-4">
      {supportItems.map((item, index) => (
        <Link
          className={`group flex min-h-56 flex-col justify-between py-7 transition-colors hover:text-brand md:px-7 ${
            index > 0 ? "border-t border-line md:border-l" : ""
          } ${index === 2 ? "md:border-l-0 lg:border-l" : ""} ${index < 2 ? "md:border-t-0" : "lg:border-t-0"}`}
          href={item.href}
          key={item.number}
        >
          <span className="text-[10px] tracking-[0.14em] text-brand">
            {item.number}
          </span>
          <span>
            <strong className="text-xl font-medium">{item.title}</strong>
            <span className="mt-3 block max-w-xs text-sm leading-6 text-muted">
              {item.description}
            </span>
            <ArrowRightIcon className="mt-6 size-4 text-brand transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      ))}
    </div>
  );
}
