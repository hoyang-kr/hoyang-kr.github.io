import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogClient } from "@/components/catalog/catalog-client";
import { PageIntro } from "@/components/ui/page-intro";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { finishes, products } from "@/data/products";

export const metadata: Metadata = {
  title: "전체 제품",
  description: "욕실 액세서리를 카테고리, 컬렉션, 마감별로 찾아보세요.",
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsPage() {
  return (
    <>
      <PageIntro
        breadcrumb="제품"
        description="카테고리, 컬렉션, 마감을 선택해 공간에 필요한 욕실 액세서리를 찾아보세요."
        title="Product catalog"
        titleClassName="text-xl leading-[1.25] font-bold tracking-[0.15em] text-[#b3262e] uppercase lg:text-2xl"
      />
      <Suspense fallback={<CatalogLoading />}>
        <CatalogClient
          categories={categories}
          collections={collections}
          finishes={finishes}
          products={products}
        />
      </Suspense>
    </>
  );
}

function CatalogLoading() {
  return (
    <div className="page-shell min-h-screen pb-24">
      <div className="border-y border-line py-5 text-sm text-muted">
        제품을 불러오는 중입니다.
      </div>
    </div>
  );
}
