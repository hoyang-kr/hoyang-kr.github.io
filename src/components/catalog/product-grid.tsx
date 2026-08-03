import {
  ProductCard,
  type ProductCardPresentation,
} from "@/components/catalog/product-card";
import type { Finish, Product } from "@/types/product";

export function ProductGrid({
  products,
  className = "",
  preferredFinish,
  presentation = "catalog",
}: {
  products: Product[];
  className?: string;
  preferredFinish?: Finish;
  presentation?: ProductCardPresentation;
}) {
  const gapClasses =
    presentation === "editorial"
      ? "gap-x-4 gap-y-12 sm:gap-x-5 md:gap-x-6 lg:gap-x-7 lg:gap-y-16"
      : "gap-x-3 gap-y-10 sm:gap-x-5 lg:gap-x-6 lg:gap-y-14";

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gapClasses} ${className}`}
      data-presentation={presentation}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          preferredFinish={preferredFinish}
          presentation={presentation}
          product={product}
        />
      ))}
    </div>
  );
}
