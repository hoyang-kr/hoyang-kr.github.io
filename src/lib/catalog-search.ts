import { productCollectionIds } from "@/lib/catalog";
import { resolveProductVariant } from "@/lib/product-variant";
import type {
  Category,
  Collection,
  Finish,
  Product,
  ProductVariant,
} from "@/types/product";

export type ProductSearchMatch = {
  product: Product;
  variant: ProductVariant;
  score: number;
};

export type CatalogSearchResults = {
  products: ProductSearchMatch[];
  categories: Category[];
  collections: Collection[];
  preferredFinish?: Finish;
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .trim()
    .replace(/\s+/g, " ");
}

export function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/[\s_-]+/g, "");
}

export function detectQueryFinish(query: string, finishes: Finish[]) {
  const normalized = normalizeSearchText(query);
  return finishes.find((finish) =>
    normalized.includes(normalizeSearchText(finish)),
  );
}

export function searchCatalog(
  query: string,
  products: Product[],
  categories: Category[],
  collections: Collection[],
  finishes: Finish[],
): CatalogSearchResults {
  const normalizedQuery = normalizeSearchText(query);
  const preferredFinish = detectQueryFinish(query, finishes);
  if (!normalizedQuery) {
    return { products: [], categories: [], collections: [], preferredFinish };
  }

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const compactQuery = compactSearchText(query);
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const collectionById = new Map(
    collections.map((collection) => [collection.id, collection]),
  );

  const productMatches = products.flatMap((product) => {
    const category = categoryById.get(product.category);
    const productCollections = productCollectionIds(product)
      .map((id) => collectionById.get(id))
      .filter((collection): collection is Collection => Boolean(collection));
    const modelNumbers = product.variants.map((variant) => variant.modelNumber);
    const searchable = normalizeSearchText(
      [
        product.nameKo,
        product.nameEn,
        product.slug,
        product.shortDescription,
        category?.name,
        category?.shortName,
        ...productCollections.flatMap((collection) => [
          collection.nameKo,
          collection.nameEn,
        ]),
        ...modelNumbers,
        ...product.variants.map((variant) => variant.finish),
      ]
        .filter(Boolean)
        .join(" "),
    );
    const compact = compactSearchText(searchable);
    const allTokensMatch = tokens.every(
      (token) =>
        searchable.includes(token) ||
        compact.includes(compactSearchText(token)),
    );
    if (!allTokensMatch && !compact.includes(compactQuery)) return [];

    const normalizedName = normalizeSearchText(product.nameKo);
    const normalizedEnglishName = normalizeSearchText(product.nameEn ?? "");
    const normalizedModels = modelNumbers.map(normalizeSearchText);
    const compactModels = modelNumbers.map(compactSearchText);
    let score = 20;
    if (
      normalizedModels.includes(normalizedQuery) ||
      compactModels.includes(compactQuery)
    )
      score += 100;
    else if (compactModels.some((model) => model.startsWith(compactQuery)))
      score += 80;
    else if (compactModels.some((model) => model.includes(compactQuery)))
      score += 65;
    if (
      normalizedName === normalizedQuery ||
      normalizedEnglishName === normalizedQuery
    )
      score += 70;
    else if (
      normalizedName.includes(normalizedQuery) ||
      normalizedEnglishName.includes(normalizedQuery)
    )
      score += 45;
    if (
      productCollections.some((collection) =>
        [collection.nameKo, collection.nameEn].some(
          (name) => normalizeSearchText(name) === normalizedQuery,
        ),
      )
    )
      score += 30;
    if (
      category &&
      [category.name, category.shortName].some(
        (name) => normalizeSearchText(name) === normalizedQuery,
      )
    )
      score += 25;

    const variant = resolveProductVariant(product.variants, preferredFinish);
    return variant ? [{ product, variant, score }] : [];
  });

  productMatches.sort(
    (a, b) =>
      b.score - a.score ||
      a.product.catalogSortOrder - b.product.catalogSortOrder,
  );

  const directCategories = categories.filter((category) =>
    directNavigationMatch(normalizedQuery, compactQuery, [
      category.name,
      category.shortName,
      category.slug,
    ]),
  );
  const directCollections = collections.filter((collection) =>
    directNavigationMatch(normalizedQuery, compactQuery, [
      collection.nameKo,
      collection.nameEn,
      collection.slug,
    ]),
  );

  return {
    products: productMatches,
    categories: directCategories.slice(0, 3),
    collections: directCollections.slice(0, 3),
    preferredFinish,
  };
}

export function searchProducts(
  query: string,
  products: Product[],
  categories: Category[],
  collections: Collection[],
  finishes: Finish[],
) {
  if (!normalizeSearchText(query)) return products;
  return searchCatalog(
    query,
    products,
    categories,
    collections,
    finishes,
  ).products.map(({ product }) => product);
}

function directNavigationMatch(
  normalizedQuery: string,
  compactQuery: string,
  values: string[],
) {
  return values.some((value) => {
    const normalizedValue = normalizeSearchText(value);
    const compactValue = compactSearchText(value);
    return (
      normalizedValue === normalizedQuery ||
      compactValue === compactQuery ||
      normalizedValue.startsWith(normalizedQuery)
    );
  });
}
