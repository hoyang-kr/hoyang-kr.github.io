import Image from "next/image";
import Link from "next/link";

import { CleanImageMask } from "@/components/catalog/clean-image-mask";
import { ArrowRightIcon } from "@/components/icons";
import { collections } from "@/data/collections";
import { products } from "@/data/products";
import { productBelongsToCollection } from "@/lib/catalog";

export function FeaturedCollectionStory() {
  const collection = collections.find((item) => item.id === "concord");
  const collectionProducts = products.filter((product) =>
    productBelongsToCollection(product, "concord"),
  );
  const primaryProduct = collectionProducts.find(
    (product) => product.category === "towel-bars",
  );
  const supportingProduct = collectionProducts.find(
    (product) => product.category === "toilet-paper-holders",
  );

  if (!collection || !primaryProduct || !supportingProduct) return null;

  const primaryVariant = primaryProduct.variants[0];
  const supportingVariant = supportingProduct.variants[0];

  if (!primaryVariant || !supportingVariant) return null;

  return (
    <section className="bg-stone py-24 lg:py-36">
      <div className="page-shell grid items-center gap-14 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:gap-20 xl:gap-28">
        <div className="grid min-h-[25rem] grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] gap-3 sm:min-h-[34rem] md:gap-5">
          <Link
            aria-label={`${primaryProduct.nameKo} 상세 보기`}
            className="group relative block overflow-hidden bg-warm-white"
            href={`/products/${primaryProduct.slug}?finish=${encodeURIComponent(primaryVariant.finish)}`}
          >
            <Image
              alt={`${primaryProduct.nameKo} ${primaryVariant.finish} 제품 이미지`}
              className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none md:p-4"
              fill
              sizes="(max-width: 1023px) 65vw, 38vw"
              src={primaryVariant.image}
            />
            <CleanImageMask src={primaryVariant.image} />
          </Link>
          <Link
            aria-label={`${supportingProduct.nameKo} 상세 보기`}
            className="group relative block h-[72%] self-end overflow-hidden bg-warm-white"
            href={`/products/${supportingProduct.slug}?finish=${encodeURIComponent(supportingVariant.finish)}`}
          >
            <Image
              alt={`${supportingProduct.nameKo} ${supportingVariant.finish} 제품 이미지`}
              className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none md:p-4"
              fill
              sizes="(max-width: 1023px) 35vw, 24vw"
              src={supportingVariant.image}
            />
            <CleanImageMask src={supportingVariant.image} />
          </Link>
        </div>

        <div className="max-w-xl lg:py-8">
          <p className="homepage-eyebrow mb-5">Featured collection</p>
          <h2 className="text-[2.625rem] leading-[1.12] font-medium tracking-[-0.05em] md:text-[3rem]">
            {collection.nameKo}
          </h2>
          <p className="mt-3 text-[11px] font-semibold tracking-[0.17em] text-muted uppercase">
            {collection.nameEn}
          </p>
          <p className="mt-8 text-[15px] leading-7 text-muted">
            {collection.description}
          </p>
          <p className="mt-3 text-[15px] leading-7 text-muted">
            수건걸이와 휴지걸이를 하나의 형태와 마감으로 연결한 구성
          </p>
          <Link
            className="button-primary mt-9"
            href={`/collections/${collection.slug}`}
          >
            컬렉션 보기
            <ArrowRightIcon className="size-4" />
          </Link>
          <div className="mt-10 border-t border-line pt-5">
            {collectionProducts.map((product) => {
              const variant = product.variants[0];
              if (!variant) return null;

              return (
                <Link
                  className="flex min-h-11 items-center justify-between border-b border-line py-3 text-sm font-medium transition-colors hover:text-brand"
                  href={`/products/${product.slug}?finish=${encodeURIComponent(variant.finish)}`}
                  key={product.id}
                >
                  {product.nameKo}
                  <ArrowRightIcon className="size-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
