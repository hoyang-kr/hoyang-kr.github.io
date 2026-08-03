import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="border-b border-line bg-warm-white">
      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex items-center">
          <div className="w-full px-5 py-18 sm:py-20 md:px-8 lg:ml-auto lg:max-w-[40rem] lg:px-8 lg:py-28 xl:px-14">
            <p className="homepage-hero-eyebrow mb-6">
              HOYANG BATHROOM COLLECTION
            </p>
            <h1 className="text-4xl leading-[1.12] font-medium tracking-[-0.055em] sm:text-5xl lg:text-[2.75rem] lg:leading-[1.08] xl:text-[3.5rem]">
              <span className="block whitespace-nowrap">공간에 스며드는</span>{" "}
              <span className="block whitespace-nowrap">욕실의 디테일</span>
            </h1>
            <p className="mt-7 max-w-md text-[15px] leading-7 text-muted md:text-base md:leading-8">
              기능과 형태, 마감의 균형을 고려한 HOYANG 욕실 액세서리를
              제안합니다.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link className="button-primary" href="/products">
                제품 살펴보기
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link className="text-link inline-flex min-h-12" href="/about">
                브랜드 이야기
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[24rem] overflow-hidden bg-stone lg:min-h-[44rem]">
          <Image
            alt={siteConfig.heroImageAlt}
            className="object-cover object-[center_55%]"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 60vw"
            src={siteConfig.heroImagePath}
          />
        </div>
      </div>
    </section>
  );
}
