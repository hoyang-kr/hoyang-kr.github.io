import { ProductCard } from "@/components/catalog/product-card";
import type { Finish, Product } from "@/types/product";

export function ProductGrid({
  products,
  className = "",
  preferredFinish,
}: {
  products: Product[];
  className?: string;
  preferredFinish?: Finish;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14 ${className}`}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          preferredFinish={preferredFinish}
          product={product}
        />
      ))}
    </div>
  );
}
