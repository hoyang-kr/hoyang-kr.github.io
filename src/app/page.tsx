import Link from "next/link";

import { CategoryCard } from "@/components/catalog/category-card";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ArrowRightIcon } from "@/components/icons";
import { FeaturedCollectionStory } from "@/components/home/featured-collection-story";
import { FinishGuide } from "@/components/home/finish-guide";
import { Hero } from "@/components/home/hero";
import { NaverCta } from "@/components/home/naver-cta";
import { SupportSection } from "@/components/home/support-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { categories, homepageCategoryIds } from "@/data/categories";
import { homepageSelectedProductConfigs } from "@/data/homepage-products";
import { products } from "@/data/products";
import type { Product } from "@/types/product";

const homepageCategoryRepresentativeProductIds: Readonly<
  Record<string, string>
> = {
  "towel-bars": "belair-towel-bar",
  "towel-shelves": "hg822s",
  "recessed-holders": "hg112s",
  mirrors: "hg9992",
};

const homepageCategoryRepresentativeFinishes: Readonly<Record<string, string>> =
  {
    "towel-bars": "사틴",
    "towel-shelves": "사틴",
    "recessed-holders": "사틴",
    mirrors: "사틴",
  };

export default function HomePage() {
  const homepageCategories = homepageCategoryIds
    .map((id) => categories.find((category) => category.id === id))
    .filter((category) => category !== undefined);
  const selectedProducts = homepageSelectedProductConfigs
    .map((config) => {
      const product = products.find((item) => item.id === config.id);
      if (!product) return undefined;
      const displayName =
        "displayName" in config ? config.displayName : undefined;

      return displayName
        ? {
            ...product,
            nameKo: displayName,
          }
        : product;
    })
    .filter((product): product is Product => product !== undefined);

  return (
    <>
      <Hero />

      <section className="page-shell py-24 lg:py-32">
        <SectionHeading
          action={{ label: "전체 제품", href: "/products" }}
          eyebrow="Browse by category"
          eyebrowClassName="homepage-eyebrow"
          title="공간과 용도에 맞는 제품"
          titleClassName="break-keep text-[2rem] md:text-[2.625rem]"
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-14">
          {homepageCategories.map((category, index) => {
            const representativeProductId =
              homepageCategoryRepresentativeProductIds[category.id];
            const representativeProduct = representativeProductId
              ? products.find(
                  (product) => product.id === representativeProductId,
                )
              : products.find((product) => product.category === category.id);
            const preferredFinish =
              homepageCategoryRepresentativeFinishes[category.id];
            const representativeVariant =
              representativeProduct?.variants.find(
                (variant) => variant.finish === preferredFinish,
              ) ?? representativeProduct?.variants[0];

            return (
              <CategoryCard
                category={category}
                image={representativeVariant?.image}
                imageAlt={
                  representativeProduct
                    ? `${representativeProduct.nameKo} ${representativeVariant?.finish} 제품 이미지`
                    : undefined
                }
                imageClassName={
                  category.id === "toilet-paper-holders"
                    ? "scale-[0.82] group-hover:scale-[0.835]"
                    : undefined
                }
                index={index}
                key={category.id}
              />
            );
          })}
        </div>
      </section>

      <FeaturedCollectionStory />

      <section className="py-24 lg:py-36">
        <div className="page-shell">
          <SectionHeading
            action={{ label: "전체 제품", href: "/products" }}
            description="HOYANG이 제안하는 주요 제품을 컬렉션과 용도별로 살펴보세요."
            eyebrow="Selected products"
            eyebrowClassName="homepage-eyebrow"
            title="공간을 완성하는 선택"
            titleClassName="break-keep text-[2rem] md:text-[2.625rem]"
          />
          <ProductGrid presentation="editorial" products={selectedProducts} />
          <Link
            className="text-link mt-10 inline-flex md:hidden"
            href="/products"
          >
            전체 제품
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>

      <section className="bg-stone py-20 lg:py-28">
        <div className="page-shell">
          <SectionHeading
            description="제품 사진과 실제 마감 샘플은 빛과 화면 환경에 따라 다르게 보일 수 있습니다."
            eyebrow="Finish guide"
            eyebrowClassName="homepage-eyebrow"
            title="공간의 인상을 결정하는 마감"
            titleClassName="break-keep text-[2rem] md:text-[2.625rem]"
          />
          <FinishGuide />
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="page-shell">
          <SectionHeading
            description="제품 확인부터 설치 전 자료까지 필요한 정보를 찾아보세요."
            eyebrow="Product support"
            eyebrowClassName="homepage-eyebrow"
            title="제품을 더 잘 사용하기 위한 지원"
            titleClassName="break-keep text-[2rem] md:text-[2.625rem]"
          />
          <SupportSection />
        </div>
      </section>

      <NaverCta />
    </>
  );
}
