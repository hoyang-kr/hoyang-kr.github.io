"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { DocumentList } from "@/components/catalog/document-list";
import { FinishSelector } from "@/components/catalog/finish-selector";
import { NaverStoreButton } from "@/components/catalog/naver-store-button";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { SpecificationTable } from "@/components/catalog/specification-table";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { isPreviewRelease, launchData } from "@/config/launch-data";
import { categoryName, productCollectionNames } from "@/lib/catalog";
import type { Product } from "@/types/product";

export function ProductDetails({ product }: { product: Product }) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0].id,
  );
  const selectedVariant = useMemo(
    () =>
      product.variants.find((variant) => variant.id === selectedVariantId) ??
      product.variants[0],
    [product.variants, selectedVariantId],
  );
  useEffect(() => {
    const requestedFinish = new URLSearchParams(window.location.search).get(
      "finish",
    );
    const requestedVariant = product.variants.find(
      (variant) => variant.finish === requestedFinish,
    );
    if (!requestedVariant || requestedVariant.id === selectedVariantId) return;
    const timer = window.setTimeout(
      () => setSelectedVariantId(requestedVariant.id),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [product.variants, selectedVariantId]);

  const selectVariant = (variantId: string) => {
    const nextVariant = product.variants.find(
      (variant) => variant.id === variantId,
    );
    if (!nextVariant) return;
    setSelectedVariantId(variantId);
    const url = new URL(window.location.href);
    url.searchParams.set("finish", nextVariant.finish);
    window.history.replaceState(window.history.state, "", url);
  };
  const collectionNames = productCollectionNames(product);
  const inquiryHref = `/contact?topic=product&product=${encodeURIComponent(product.nameKo)}`;
  const listingStatusLabels = {
    active: "판매 중",
    inactive: "판매하지 않음",
    "coming-soon": "판매 준비 중",
    "inquiry-only": "문의 구매",
    unverified: "판매 정보 확인 중",
  } as const;

  return (
    <>
      <div className="page-shell py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: "제품", href: "/products" },
            { label: product.nameKo },
          ]}
        />
      </div>

      <section className="page-shell grid gap-10 pb-18 lg:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)] lg:gap-16 lg:pb-28">
        <ProductGallery
          key={selectedVariant.id}
          productName={product.nameKo}
          variant={selectedVariant}
        />

        <div className="lg:sticky lg:top-32 lg:self-start">
          {collectionNames.length ? (
            <p className="eyebrow mb-4">{collectionNames.join(" / ")} 컬렉션</p>
          ) : null}
          <h1 className="text-3xl leading-tight font-medium tracking-[-0.04em] md:text-4xl">
            {product.nameKo}
          </h1>
          {selectedVariant.modelNumber ? (
            <p className="mt-3 text-xs tracking-[0.08em] text-muted">
              MODEL {selectedVariant.modelNumber}
            </p>
          ) : null}
          {product.shortDescription ? (
            <p className="mt-6 text-sm leading-7 text-muted">
              {product.shortDescription}
            </p>
          ) : null}

          <div className="my-8 border-y border-line py-7">
            <FinishSelector
              onChange={selectVariant}
              selectedId={selectedVariant.id}
              variants={product.variants}
            />
          </div>

          <div className="mb-5 flex items-center justify-between text-xs">
            <span className="text-muted">판매 상태</span>
            <span className="flex items-center gap-2 font-medium">
              <span
                className={`size-1.5 rounded-full ${
                  selectedVariant.naverListingStatus === "active"
                    ? "bg-ink"
                    : "bg-steel"
                }`}
              />
              {listingStatusLabels[selectedVariant.naverListingStatus]}
            </span>
          </div>

          <NaverStoreButton
            className="w-full"
            inquiryHref={inquiryHref}
            listingStatus={selectedVariant.naverListingStatus}
            productName={`${product.nameKo} ${selectedVariant.finish}`}
            url={selectedVariant.naverUrl}
          />
          {selectedVariant.naverListingStatus !== "inquiry-only" ? (
            <Link className="button-secondary mt-3 w-full" href={inquiryHref}>
              제품 문의하기
            </Link>
          ) : null}
          <p className="mt-4 text-[11px] leading-5 text-muted">
            구매는 네이버 스마트스토어의 외부 판매 페이지에서 진행됩니다.
          </p>
        </div>
      </section>

      {product.features.length > 0 || isPreviewRelease ? (
        <div className="border-t border-line bg-stone">
          <div className="page-shell grid md:grid-cols-[15rem_1fr]">
            <h2 className="py-7 text-lg font-medium md:border-r md:border-line md:py-10">
              제품 특징
            </h2>
            <div className="pb-10 md:p-10">
              {product.features.length > 0 ? (
                <ul className="grid gap-3 text-sm text-muted sm:grid-cols-2">
                  {product.features.map((feature) => (
                    <li className="border-b border-line pb-3" key={feature}>
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ProductInformation product={product} variant={selectedVariant} />
    </>
  );
}

function ProductInformation({
  product,
  variant,
}: {
  product: Product;
  variant: Product["variants"][number];
}) {
  const sections = [
    {
      id: "specifications",
      title: "제품 사양",
      content: <SpecificationTable specifications={product.specifications} />,
      available: Object.keys(product.specifications).length > 0,
    },
    {
      id: "drawings",
      title: "치수 및 도면",
      content: <DocumentList documents={variant.documents} />,
      available: (variant.documents?.length ?? 0) > 0,
    },
    {
      id: "installation",
      title: "설치 안내",
      content: (
        <p className="text-sm leading-7 text-muted">
          {launchData.customerPolicy.installationResponsibilityStatement}
        </p>
      ),
      available: !isPreviewRelease,
    },
    {
      id: "care",
      title: "제품 관리",
      content: (
        <p className="text-sm leading-7 text-muted">
          {launchData.customerPolicy.productCareSummary}
        </p>
      ),
      available: !isPreviewRelease,
    },
    {
      id: "purchase",
      title: "구매 안내",
      content: (
        <div className="space-y-3 text-sm leading-7 text-muted">
          <p>
            제품 구매와 결제는 연결된 네이버 스마트스토어 판매 페이지에서
            진행됩니다.
          </p>
          <p>배송: {launchData.customerPolicy.deliveryInformationSummary}</p>
          <p>교환 및 반품: {launchData.customerPolicy.returnExchangeSummary}</p>
        </div>
      ),
      available: !isPreviewRelease,
    },
  ];
  const visibleSections = sections.filter(
    (section) => isPreviewRelease || section.available,
  );

  return (
    <section className="page-shell py-10 md:py-18">
      {visibleSections.map((section) => (
        <div
          className="grid border-b border-line py-8 md:grid-cols-[15rem_1fr] md:py-10"
          id={section.id}
          key={section.id}
        >
          <h2 className="mb-5 text-lg font-medium md:mb-0">{section.title}</h2>
          <div>{section.content}</div>
        </div>
      ))}
      <p className="mt-5 text-right text-[10px] text-muted">
        카테고리: {categoryName(product.category)}
      </p>
    </section>
  );
}
