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
      className="group border-t border-line bg-warm-white py-5 transition-colors hover:bg-warm-white sm:px-3"
      href={`/products?category=${category.id}`}
    >
      <span className="mb-4 flex items-center justify-between">
        <span className="text-[10px] tracking-[0.16em] text-brand">
          {String(index + 1).padStart(2, "0")}
        </span>
        <ArrowRightIcon className="size-4 text-brand transition-transform group-hover:translate-x-1" />
      </span>
      {image ? (
        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-warm-white">
          <Image
            alt={imageAlt ?? ""}
            className={["object-contain p-1", imageClassName]
              .filter(Boolean)
              .join(" ")}
            fill
            sizes="(max-width: 767px) 50vw, 33vw"
            src={image}
          />
          <CleanImageMask src={image} />
        </span>
      ) : null}
      <span className="mt-4 block">
        <strong className="block text-base font-medium tracking-[-0.025em] sm:text-lg">
          {displayName ?? category.shortName}
        </strong>
        <span className="mt-2 hidden text-xs leading-5 text-muted sm:block">
          {category.description}
        </span>
      </span>
    </Link>
  );
}
