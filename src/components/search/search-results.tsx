"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { productCollectionNames } from "@/lib/catalog";
import { isBrioBpProductImage } from "@/lib/product-image";
import type { CatalogSearchResults } from "@/lib/catalog-search";

export type SearchOption = { href: string; label: string };

export function buildSearchOptions(
  query: string,
  results: CatalogSearchResults,
): SearchOption[] {
  return [
    ...results.products.slice(0, 8).map(({ product, variant }) => ({
      href: productHref(product.slug, variant.finish),
      label: product.nameKo + " " + variant.finish,
    })),
    ...results.categories.map((category) => ({
      href: "/products?category=" + encodeURIComponent(category.id),
      label: category.name + " 카테고리",
    })),
    ...results.collections.map((collection) => ({
      href: "/products?collection=" + encodeURIComponent(collection.id),
      label: collection.nameKo + " 컬렉션",
    })),
    {
      href: "/products?q=" + encodeURIComponent(query.trim()),
      label: "‘" + query.trim() + "’ 검색 결과 모두 보기",
    },
  ];
}

export function SearchResults({
  activeIndex,
  instanceId,
  onActiveIndexChange,
  onSelect,
  query,
  results,
}: {
  activeIndex: number;
  instanceId: string;
  onActiveIndexChange: (index: number) => void;
  onSelect?: () => void;
  query: string;
  results: CatalogSearchResults;
}) {
  let optionIndex = 0;
  const productResults = results.products.slice(0, 8);
  const hasResults =
    productResults.length > 0 ||
    results.categories.length > 0 ||
    results.collections.length > 0;

  if (!hasResults) {
    return (
      <div
        aria-live="polite"
        className="border-t border-line px-5 py-7 md:px-0"
      >
        <p className="font-semibold">검색 결과가 없습니다.</p>
        <p className="mt-2 text-sm text-muted">
          제품명이나 모델 번호를 다시 확인해 주세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="button-secondary"
            href="/products"
            onClick={onSelect}
          >
            전체 제품 보기
          </Link>
          <Link
            className="button-secondary"
            href="/contact?topic=product"
            onClick={onSelect}
          >
            제품 문의
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[min(62vh,36rem)] overflow-y-auto border-t border-line py-5">
      <p className="sr-only" aria-live="polite">
        제품 검색 결과 {results.products.length}개
      </p>
      {productResults.length > 0 ? (
        <ResultGroup label="제품">
          <div className="grid gap-px bg-line md:grid-cols-2">
            {productResults.map(({ product, variant }) => {
              const index = optionIndex++;
              const collectionLabel =
                productCollectionNames(product).join(" / ") || "HOYANG";
              return (
                <Link
                  aria-selected={activeIndex === index}
                  className="flex min-h-24 items-center gap-4 bg-white px-4 py-3 outline-none hover:bg-stone focus:bg-stone data-[active=true]:bg-stone"
                  data-active={activeIndex === index}
                  data-search-option
                  href={productHref(product.slug, variant.finish)}
                  id={"search-option-" + instanceId + "-" + index}
                  key={product.id}
                  onClick={onSelect}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  role="option"
                >
                  <span
                    className={`relative size-18 shrink-0 border border-line bg-white ${
                      isBrioBpProductImage(variant.image)
                        ? "overflow-hidden"
                        : ""
                    }`}
                  >
                    <Image
                      alt={
                        product.nameKo + " " + variant.finish + " 제품 이미지"
                      }
                      className={`object-contain p-1 ${
                        isBrioBpProductImage(variant.image)
                          ? "scale-[2.05]"
                          : ""
                      }`}
                      fill
                      sizes="72px"
                      src={variant.image}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {product.nameKo}
                    </span>
                    {variant.modelNumber ? (
                      <span className="mt-1 block text-xs text-muted">
                        {variant.modelNumber}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[11px] text-muted">
                      {collectionLabel} ·{" "}
                      {product.variants.map((item) => item.finish).join(" · ")}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </ResultGroup>
      ) : null}

      {results.categories.length > 0 ? (
        <ResultGroup label="카테고리">
          <div className="flex flex-wrap gap-2">
            {results.categories.map((category) => {
              const index = optionIndex++;
              return (
                <Link
                  aria-selected={activeIndex === index}
                  className="border border-line px-4 py-2.5 text-sm hover:border-brand focus:border-brand"
                  data-search-option
                  href={"/products?category=" + encodeURIComponent(category.id)}
                  id={"search-option-" + instanceId + "-" + index}
                  key={category.id}
                  onClick={onSelect}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  role="option"
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        </ResultGroup>
      ) : null}

      {results.collections.length > 0 ? (
        <ResultGroup label="컬렉션">
          <div className="flex flex-wrap gap-2">
            {results.collections.map((collection) => {
              const index = optionIndex++;
              return (
                <Link
                  aria-selected={activeIndex === index}
                  className="border border-line px-4 py-2.5 text-sm hover:border-brand focus:border-brand"
                  data-search-option
                  href={
                    "/products?collection=" + encodeURIComponent(collection.id)
                  }
                  id={"search-option-" + instanceId + "-" + index}
                  key={collection.id}
                  onClick={onSelect}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  role="option"
                >
                  {collection.nameKo} / {collection.nameEn}
                </Link>
              );
            })}
          </div>
        </ResultGroup>
      ) : null}

      <div className="mt-5 border-t border-line pt-4">
        {(() => {
          const index = optionIndex;
          return (
            <Link
              aria-selected={activeIndex === index}
              className="text-link inline-flex"
              data-search-option
              href={"/products?q=" + encodeURIComponent(query.trim())}
              id={"search-option-" + instanceId + "-" + index}
              onClick={onSelect}
              onMouseEnter={() => onActiveIndexChange(index)}
              role="option"
            >
              ‘{query.trim()}’ 검색 결과 모두 보기
            </Link>
          );
        })()}
      </div>
    </div>
  );
}

function ResultGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <h2 className="mb-3 text-xs font-bold tracking-[0.12em] text-brand">
        {label}
      </h2>
      {children}
    </section>
  );
}

function productHref(slug: string, finish: string) {
  return "/products/" + slug + "?finish=" + encodeURIComponent(finish);
}
