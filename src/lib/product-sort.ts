import type { Product } from "@/types/product";

export function sortProductsFeaturedFirst(
  products: readonly Product[],
): Product[] {
  return [...products].sort((a, b) => Number(b.featured) - Number(a.featured));
}
