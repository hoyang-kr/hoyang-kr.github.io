"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { CleanImageMask } from "@/components/catalog/clean-image-mask";
import { ArrowRightIcon } from "@/components/icons";
import { productCollectionNames } from "@/lib/catalog";
import { isBrioBpProductImage } from "@/lib/product-image";
import { resolveProductVariant } from "@/lib/product-variant";
import type { Finish, Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  preferredFinish?: Finish;
};

export function ProductCard({ product, preferredFinish }: ProductCardProps) {
  const preferredVariant = resolveProductVariant(
    product.variants,
    preferredFinish,
  );
  const preferredId = preferredVariant?.id ?? "";
  const [selection, setSelection] = useState(() => ({
    preferredFinish,
    selectedId: preferredId,
  }));
  const synchronizedSelection =
    selection.preferredFinish === preferredFinish
      ? selection
      : { preferredFinish, selectedId: preferredId };

  if (synchronizedSelection !== selection) {
    setSelection(synchronizedSelection);
  }

  const selected =
    product.variants.find(
      (variant) => variant.id === synchronizedSelection.selectedId,
    ) ?? preferredVariant;

  if (!selected) return null;
  const detailHref = `/products/${product.slug}?finish=${encodeURIComponent(selected.finish)}`;
  const hasMultipleFinishes = product.variants.length > 1;

  return (
    <article className="group min-w-0">
      <Link
        aria-label={`${product.nameKo} 상세 보기`}
        className="relative block aspect-square overflow-hidden border border-line bg-white"
        href={detailHref}
      >
        <Image
          alt={`${product.nameKo} ${selected.finish} 제품 이미지`}
          className={`object-contain p-1 transition-transform duration-500 ease-out md:p-2 ${
            isBrioBpProductImage(selected.image)
              ? "scale-[2.05] group-hover:scale-[2.08]"
              : "group-hover:scale-[1.018]"
          }`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          src={selected.image}
        />
        <CleanImageMask src={selected.image} />
        {product.featured ? (
          <span className="absolute top-3 left-3 z-20 border border-line bg-warm-white/90 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] uppercase">
            Featured
          </span>
        ) : null}
      </Link>
      <div className="pt-4">
        <p className="text-[10px] font-semibold tracking-[0.13em] text-muted uppercase">
          {productCollectionNames(product).join(" / ")}
        </p>
        <Link
          className="mt-1.5 flex items-start justify-between gap-3 text-[15px] font-medium tracking-[-0.02em] hover:text-muted md:text-base"
          href={detailHref}
        >
          <span>{product.nameKo}</span>
          <ArrowRightIcon className="mt-0.5 hidden size-4 shrink-0 text-brand opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
        </Link>
        {selected.modelNumber ? (
          <p className="mt-1 text-[11px] text-muted">
            모델 {selected.modelNumber}
          </p>
        ) : null}
        <div
          aria-label={`마감: ${selected.finish}`}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          {hasMultipleFinishes ? (
            product.variants.map((variant) => (
              <button
                aria-label={`마감: ${variant.finish}`}
                aria-pressed={variant.id === selected.id}
                className="finish-chip"
                data-selected={variant.id === selected.id}
                key={variant.id}
                onClick={() =>
                  setSelection({
                    preferredFinish,
                    selectedId: variant.id,
                  })
                }
                type="button"
              >
                <span className={`finish-swatch finish-${variant.finish}`} />
                <span>{variant.finish}</span>
              </button>
            ))
          ) : (
            <span className="finish-chip finish-chip-static">
              <span className={`finish-swatch finish-${selected.finish}`} />
              <span>{selected.finish}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
