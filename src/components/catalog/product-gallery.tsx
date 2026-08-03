"use client";

import { useState } from "react";
import Image from "next/image";

import { CleanImageMask } from "@/components/catalog/clean-image-mask";
import { isPreviewRelease } from "@/config/launch-data";
import { isBrioBpProductImage } from "@/lib/product-image";
import type { ProductVariant } from "@/types/product";

type ProductGalleryProps = {
  productName: string;
  variant: ProductVariant;
};

export function ProductGallery({ productName, variant }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(variant.image);
  const currentImage = variant.gallery.includes(selectedImage)
    ? selectedImage
    : variant.image;

  return (
    <div>
      <div
        className={`relative aspect-[4/3] border border-line bg-white ${
          isBrioBpProductImage(currentImage) ? "overflow-hidden" : ""
        }`}
      >
        <Image
          alt={`${productName} ${variant.finish} 제품 이미지`}
          className={`object-contain p-1 sm:p-2 ${
            isBrioBpProductImage(currentImage) ? "scale-[1.6]" : ""
          }`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 56vw"
          src={currentImage}
        />
        <CleanImageMask src={currentImage} />
        {variant.image.endsWith(".svg") ? (
          <span className="absolute right-4 bottom-4 border border-line bg-warm-white/85 px-2.5 py-1 text-[9px] tracking-[0.12em] text-muted uppercase backdrop-blur">
            이미지 준비 중
          </span>
        ) : null}
      </div>
      {variant.gallery.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {variant.gallery.map((image, index) => (
            <button
              aria-label={`${productName} 이미지 ${index + 1} 보기`}
              className={`relative aspect-square border border-line bg-white ${
                currentImage === image ? "ring-1 ring-ink" : ""
              } ${isBrioBpProductImage(image) ? "overflow-hidden" : ""}`}
              key={image}
              onClick={() => setSelectedImage(image)}
              type="button"
            >
              <Image
                alt=""
                className={`object-contain p-2 ${
                  isBrioBpProductImage(image) ? "scale-[2.05]" : ""
                }`}
                fill
                sizes="120px"
                src={image}
              />
              <CleanImageMask src={image} />
            </button>
          ))}
        </div>
      ) : null}
      {isPreviewRelease ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-line bg-stone p-6 text-center">
            <div>
              <p className="text-xs font-semibold">설치 공간 이미지</p>
              <p className="mt-2 text-[11px] text-muted">사진 준비 중</p>
            </div>
          </div>
          <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-line bg-stone p-6 text-center">
            <div>
              <p className="text-xs font-semibold">치수 및 도면</p>
              <p className="mt-2 text-[11px] text-muted">도면 준비 중</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
