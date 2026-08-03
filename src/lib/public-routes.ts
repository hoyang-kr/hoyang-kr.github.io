import { launchData } from "@/config/launch-data";
import { collections } from "@/data/collections";
import { products } from "@/data/products";

export type PublicRouteDefinition = {
  path: string;
  kind: "static" | "product" | "collection";
  indexable: boolean;
  exclusionReason?: string;
};

export function getPublicRouteDefinitions(): PublicRouteDefinition[] {
  const staticRoutes: PublicRouteDefinition[] = [
    { path: "/", kind: "static", indexable: true },
    { path: "/products", kind: "static", indexable: true },
    { path: "/collections", kind: "static", indexable: true },
    { path: "/about", kind: "static", indexable: true },
    { path: "/dealers", kind: "static", indexable: true },
    { path: "/support", kind: "static", indexable: true },
    { path: "/contact", kind: "static", indexable: true },
    {
      path: "/privacy",
      kind: "static",
      indexable: launchData.legal.privacyPolicyStatus === "final",
      exclusionReason:
        launchData.legal.privacyPolicyStatus === "final"
          ? undefined
          : "draft legal page is noindex",
    },
    {
      path: "/terms",
      kind: "static",
      indexable: launchData.legal.termsStatus === "final",
      exclusionReason:
        launchData.legal.termsStatus === "final"
          ? undefined
          : "draft legal page is noindex",
    },
  ];

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      path: `/products/${product.slug}`,
      kind: "product" as const,
      indexable: true,
    })),
    ...collections.map((collection) => ({
      path: `/collections/${collection.slug}`,
      kind: "collection" as const,
      indexable: true,
    })),
  ];
}

export function getIndexablePublicPaths() {
  return getPublicRouteDefinitions()
    .filter((route) => route.indexable)
    .map((route) => route.path);
}
