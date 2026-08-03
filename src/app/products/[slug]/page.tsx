import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetails } from "@/components/catalog/product-details";
import { RelatedProducts } from "@/components/catalog/related-products";
import { getProductBySlug, getProductsByIds, products } from "@/data/products";
import { productCollectionNames } from "@/lib/catalog";
import { buildProductStructuredData } from "@/lib/structured-data";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.flatMap((product) =>
    [product.slug, ...(product.legacySlugs ?? [])].map((slug) => ({ slug })),
  );
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  const collectionLabel = productCollectionNames(product).join(" / ");
  const description =
    product.shortDescription ??
    `${collectionLabel} ${product.nameKo} 제품 정보`;

  return {
    title: product.nameKo,
    description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: product.nameKo,
      description,
      images: [
        {
          url: product.variants[0].image,
          alt: `${product.nameKo} 제품 이미지`,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const relatedProducts = getProductsByIds(product.relatedProductIds);
  const structuredData = buildProductStructuredData(product);

  return (
    <>
      {structuredData ? (
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
          type="application/ld+json"
        />
      ) : null}
      <ProductDetails product={product} />
      <RelatedProducts products={relatedProducts} />
    </>
  );
}
