import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionProductBrowser } from "@/components/catalog/collection-product-browser";
import { ArrowRightIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { isPreviewRelease } from "@/config/launch-data";
import { categories } from "@/data/categories";
import { collections, getCollection } from "@/data/collections";
import { products } from "@/data/products";
import { productBelongsToCollection } from "@/lib/catalog";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return {};

  return {
    title: `${collection.nameKo} 컬렉션`,
    description: collection.description,
    alternates: {
      canonical: `/collections/${collection.slug}`,
    },
    openGraph: {
      title: `${collection.nameKo} 컬렉션`,
      description: collection.description,
      images: [{ url: collection.image, alt: `${collection.nameKo} 컬렉션` }],
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const collectionProducts = products.filter((product) =>
    productBelongsToCollection(product, collection.id),
  );
  const relatedCategories = categories.filter((category) =>
    collectionProducts.some((product) => product.category === category.id),
  );

  return (
    <>
      <div className="page-shell py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: "컬렉션", href: "/collections" },
            { label: collection.nameKo },
          ]}
        />
      </div>
      <section className="page-shell pb-18 md:pb-28">
        <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-0">
          <div className="flex flex-col justify-center bg-surface p-8 md:p-14 lg:p-18">
            <p className="eyebrow-section mb-6">{collection.nameEn}</p>
            <h1 className="text-5xl font-medium tracking-[-0.055em] md:text-7xl">
              {collection.nameKo}
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-muted">
              {collection.description}
            </p>
            {isPreviewRelease && collection.editorialReviewRequired ? (
              <p className="mt-4 text-[10px] text-muted">
                소개 문구 편집 검토 필요
              </p>
            ) : null}
          </div>
          <div className="relative aspect-[4/3] bg-stone lg:aspect-auto lg:min-h-[34rem]">
            <Image
              alt={`${collection.nameKo} 컬렉션 제품 이미지`}
              className="object-contain p-3 md:p-6"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              src={collection.image}
            />
          </div>
        </div>
      </section>

      <section className="page-shell pb-24 md:pb-32">
        <div className="mb-10">
          <p className="eyebrow-section mb-4">Products</p>
          <h2 className="text-3xl font-medium tracking-[-0.035em]">
            {collection.nameKo} 제품
          </h2>
        </div>
        <CollectionProductBrowser products={collectionProducts} />
      </section>

      {relatedCategories.length > 0 ? (
        <section className="border-t border-line bg-stone py-18 md:py-24">
          <div className="page-shell">
            <h2 className="mb-8 text-2xl font-medium tracking-[-0.03em]">
              관련 카테고리
            </h2>
            <div className="grid border-t border-line md:grid-cols-3">
              {relatedCategories.map((category, index) => (
                <Link
                  className={`group flex items-center justify-between py-5 text-sm font-medium hover:text-muted md:px-5 ${
                    index > 0
                      ? "border-t border-line md:border-t-0 md:border-l"
                      : ""
                  }`}
                  href={`/products?category=${category.id}&collection=${collection.id}`}
                  key={category.id}
                >
                  {category.name}
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
