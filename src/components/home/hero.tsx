import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, ExternalIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="grid min-h-[42rem] lg:grid-cols-[0.82fr_1.18fr]">
        <div className="flex items-center">
          <div className="w-full px-5 py-18 md:px-8 lg:ml-auto lg:max-w-[44rem] lg:px-14">
            <p
              className="homepage-hero-eyebrow mb-6 font-medium tracking-[0.075em]"
              aria-label="EssentialBathroomStorage"
            >
              <span aria-hidden="true" className="inline-flex items-baseline">
                <strong className="font-extrabold">E</strong>
                <span>ssential</span>
                <strong className="font-extrabold">B</strong>
                <span>athroom</span>
                <strong className="font-extrabold">S</strong>
                <span>torage</span>
              </span>
            </p>
            <h1 className="max-w-lg text-2xl leading-[1.2] font-medium tracking-[-0.045em] text-balance sm:text-2xl lg:text-3xl">
              {/* 욕실을 완성하는 정제된 디테일 */}
              컬렉션과 마감으로 완성하는 욕실
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-7 text-muted md:text-base">
              공간에 자연스럽게 어우러지는 디자인과 실용적인 구조의 욕실을
              제안합니다.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="button-primary" href="/products">
                제품 살펴보기
                <ArrowRightIcon className="size-4" />
              </Link>
              {siteConfig.naverSmartStoreUrl ? (
                <a
                  className="button-naver"
                  href={siteConfig.naverSmartStoreUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  네이버 스토어
                  <ExternalIcon className="size-4" />
                </a>
              ) : (
                <Link
                  className="button-secondary"
                  href="/contact?topic=product"
                >
                  제품 문의
                  <ArrowRightIcon className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="relative min-h-[25rem] overflow-hidden bg-stone lg:min-h-[42rem]">
          <Image
            alt={siteConfig.heroImageAlt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            src={siteConfig.heroImagePath}
          />
        </div>
      </div>
    </section>
  );
}
