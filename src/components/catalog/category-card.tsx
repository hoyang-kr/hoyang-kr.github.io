import Image from "next/image";
import Link from "next/link";

import { CleanImageMask } from "@/components/catalog/clean-image-mask";
import { ArrowRightIcon } from "@/components/icons";
import type { Category } from "@/types/product";

export function CategoryCard({
  category,
  index,
  image,
  imageAlt,
  imageClassName,
  displayName,
}: {
  category: Category;
  index: number;
  image?: string;
  imageAlt?: string;
  imageClassName?: string;
  displayName?: string;
}) {
  return (
    <Link
      className="group block min-w-0"
      href={`/products?category=${category.id}`}
    >
      {image ? (
        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-surface">
          <Image
            alt={imageAlt ?? ""}
            className={[
              "object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none md:p-4",
              imageClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
            src={image}
          />
          <CleanImageMask src={image} />
        </span>
      ) : (
        <span className="block aspect-[4/3] w-full bg-surface" />
      )}
      <span className="mt-5 flex min-h-11 items-start justify-between gap-3">
        <span>
          <span className="block text-[10px] font-semibold tracking-[0.17em] text-brand">
            {String(index + 1).padStart(2, "0")}
          </span>
          <strong className="mt-2 block text-[15px] leading-6 font-medium tracking-[-0.025em] sm:text-lg">
            {displayName ?? category.shortName}
          </strong>
        </span>
        <ArrowRightIcon className="mt-5 size-4 shrink-0 translate-x-0 text-brand opacity-40 transition-[transform,opacity] group-hover:translate-x-1 group-hover:opacity-100 motion-reduce:transition-none" />
      </span>
    </Link>
  );
}
