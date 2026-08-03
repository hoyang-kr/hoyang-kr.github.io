import type { Metadata } from "next";

import { CollectionCard } from "@/components/catalog/collection-card";
import { PageIntro } from "@/components/ui/page-intro";
import { collections } from "@/data/collections";

export const metadata: Metadata = {
  title: "Collections",
  description: "욕실 액세서리 컬렉션을 둘러보세요.",
  alternates: {
    canonical: "/collections",
  },
};

export default function CollectionsPage() {
  return (
    <>
      <PageIntro
        description="제품군별 형태와 마감 옵션을 한눈에 살펴볼 수 있습니다."
        title="Collections"
        titleClassName="text-[2.75rem] leading-tight font-medium tracking-[-0.05em] md:text-[4.25rem]"
      />
      <section className="page-shell pb-24 md:pb-32">
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => (
            <CollectionCard
              collection={collection}
              key={collection.id}
              priority={index < 3}
            />
          ))}
        </div>
      </section>
    </>
  );
}
