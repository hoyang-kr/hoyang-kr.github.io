import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import type { Product } from "@/types/product";

export function categoryName(id: string) {
  return categories.find((category) => category.id === id)?.name ?? id;
}

export function collectionName(id?: string) {
  if (!id) return undefined;
  return collections.find((collection) => collection.id === id)?.nameKo ?? id;
}

export function productCollectionIds(
  product: Pick<Product, "collection" | "collectionIds">,
) {
  return [
    ...new Set(
      [product.collection, ...(product.collectionIds ?? [])].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];
}

export function productBelongsToCollection(
  product: Pick<Product, "collection" | "collectionIds">,
  collectionId: string,
) {
  return productCollectionIds(product).includes(collectionId);
}

export function productCollectionNames(
  product: Pick<Product, "collection" | "collectionIds">,
) {
  return productCollectionIds(product)
    .map((id) => collectionName(id))
    .filter((name): name is string => Boolean(name));
}
