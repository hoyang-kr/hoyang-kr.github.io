import Link from "next/link";

import { ExternalIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export function NaverCta() {
  const hasStore = Boolean(siteConfig.naverSmartStoreUrl);

  return (
    <section className="bg-ink py-18 text-white md:py-24">
      <div className="page-shell grid items-end gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow-section mb-5 text-white/55">
            {hasStore ? "Official store" : "Product inquiry"}
          </p>
          <h2 className="text-3xl leading-tight font-medium tracking-[-0.04em] md:text-4xl">
            {hasStore ? (
              <>
                선택한 제품은 네이버에서
                <br className="hidden sm:block" /> 편리하게 구매하세요.
              </>
            ) : (
              <>
                공간에 맞는 제품을
                <br className="hidden sm:block" /> 함께 찾아보세요.
              </>
            )}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/65">
            {hasStore
              ? "제품별 구매 버튼을 통해 해당 마감의 네이버 스마트스토어 판매 페이지로 이동할 수 있습니다."
              : "제품 선택과 납품 조건에 필요한 내용을 보내주시면 확인 후 안내해 드립니다."}
          </p>
        </div>
        {siteConfig.naverSmartStoreUrl ? (
          <a
            className="button-naver min-w-52"
            href={siteConfig.naverSmartStoreUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            네이버 스토어
            <ExternalIcon className="size-4" />
          </a>
        ) : (
          <Link
            className="inline-flex min-h-12 min-w-52 items-center justify-center border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:border-white/60"
            href="/contact?topic=product"
          >
            제품 문의
          </Link>
        )}
      </div>
    </section>
  );
}
