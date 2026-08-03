import Image from "next/image";
import Link from "next/link";

import { CleanImageMask } from "@/components/catalog/clean-image-mask";
import { ArrowRightIcon } from "@/components/icons";
import type { Collection } from "@/types/product";

export function CollectionCard({
  collection,
  priority = false,
}: {
  collection: Collection;
  priority?: boolean;
}) {
  return (
    <article className="group bg-white">
      <Link
        aria-label={`${collection.nameKo} 컬렉션 보기`}
        className="relative block aspect-[4/3] overflow-hidden border border-line bg-white"
        href={`/collections/${collection.slug}`}
      >
        <Image
          alt={`${collection.nameKo} 컬렉션 제품 이미지`}
          className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.018] md:p-5"
          fill
          priority={priority}
          sizes="(max-width: 768px) 80vw, 33vw"
          src={collection.image}
        />
        <CleanImageMask src={collection.image} />
      </Link>
      <div className="flex items-start justify-between gap-5 border-b border-line py-4">
        <div>
          <h3 className="text-lg font-medium tracking-[-0.025em]">
            {collection.nameKo}
          </h3>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-muted uppercase">
            {collection.nameEn}
          </p>
        </div>
        <Link
          aria-label={`${collection.nameKo} 컬렉션 자세히 보기`}
          className="mt-1"
          href={`/collections/${collection.slug}`}
        >
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
