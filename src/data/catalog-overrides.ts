import { launchData } from "@/config/launch-data";
import type { Finish, Product, ProductDocument } from "@/types/product";

const knownFinishes = new Set<Finish>([
  "사틴",
  "크롬",
  "블랙",
  "무광",
  "미확인",
]);

export type CatalogRedirect = {
  source: string;
  destination: string;
  permanent: true;
};

export function applyCatalogOverrides(sourceProducts: Product[]) {
  const products = structuredClone(sourceProducts);
  const productsById = new Map(
    products.map((product) => [product.id, product]),
  );

  for (const record of launchData.products) {
    if (record.verificationStatus !== "verified") continue;
    const product = productsById.get(record.productId);
    const variant = product?.variants.find(
      (candidate) => candidate.id === record.variantId,
    );
    if (!product || !variant) continue;

    if (record.verifiedProductNameKo) {
      product.nameKo = record.verifiedProductNameKo;
    }
    if (record.verifiedCollection) {
      product.collection = record.verifiedCollection;
    }
    if (record.verifiedCategory) {
      product.category = record.verifiedCategory;
    }
    if (record.modelNumber) variant.modelNumber = record.modelNumber;
    if (knownFinishes.has(record.finish as Finish)) {
      variant.finish = record.finish as Finish;
    }
    if (record.imagePath) {
      variant.image = record.imagePath;
      variant.gallery = [record.imagePath];
    }
    variant.available = record.available;
    variant.customerVisible = record.customerVisible;
    variant.launchVerificationStatus = "verified";
    product.specifications = {
      ...product.specifications,
      ...(record.dimensions ? { 치수: record.dimensions } : {}),
      ...(record.material ? { 소재: record.material } : {}),
      ...(record.installationMethod
        ? { "설치 방식": record.installationMethod }
        : {}),
    };
    const documents = parseDocuments(record.documentPaths);
    if (documents.length > 0) variant.documents = documents;
  }

  for (const record of launchData.naverLinks) {
    const product = productsById.get(record.productId);
    const variant = product?.variants.find(
      (candidate) => candidate.id === record.variantId,
    );
    if (!variant) continue;
    variant.naverListingStatus = record.listingStatus;
    variant.naverUrl = record.naverUrl || undefined;
  }

  for (const correction of launchData.catalogCorrections) {
    if (correction.status !== "verified") continue;
    const product = productsById.get(correction.productId);
    if (!product) continue;
    const variant = correction.variantId
      ? product.variants.find(
          (candidate) => candidate.id === correction.variantId,
        )
      : undefined;
    const targetProduct = correction.targetProductId
      ? productsById.get(correction.targetProductId)
      : undefined;
    const displayProduct = targetProduct ?? product;

    if (targetProduct && variant && targetProduct.id !== product.id) {
      product.variants = product.variants.filter(
        (candidate) => candidate.id !== variant?.id,
      );
      targetProduct.variants.push(variant);
    }

    if (correction.displayNameKo) {
      displayProduct.nameKo = correction.displayNameKo;
    }
    if (correction.collection) {
      displayProduct.collection = correction.collection;
    }
    if (correction.category) displayProduct.category = correction.category;
    if (correction.relatedProductIds.length > 0) {
      displayProduct.relatedProductIds = correction.relatedProductIds;
    }
    if (correction.newSlug && !targetProduct) {
      displayProduct.slug = correction.newSlug;
    }
    if (correction.customerVisible !== null) {
      displayProduct.customerVisible = correction.customerVisible;
      if (variant) variant.customerVisible = correction.customerVisible;
    }
    if (variant) {
      if (knownFinishes.has(correction.finish as Finish)) {
        variant.finish = correction.finish as Finish;
      }
      if (correction.modelNumber) {
        variant.modelNumber = correction.modelNumber;
      }
      if (correction.imagePath) {
        variant.image = correction.imagePath;
        variant.gallery = [correction.imagePath];
      }
    }
  }

  for (const product of products) {
    product.variants = product.variants.filter(
      (variant) => variant.customerVisible,
    );
    if (product.variants.length === 0) product.customerVisible = false;
    product.launchVerificationStatus = product.variants.every(
      (variant) => variant.launchVerificationStatus === "verified",
    )
      ? "verified"
      : "unverified";
  }

  return products;
}

export const catalogRedirects: CatalogRedirect[] =
  launchData.catalogCorrections.flatMap((correction) => {
    if (
      correction.status !== "verified" ||
      !correction.newSlug ||
      correction.previousSlugs.length === 0
    ) {
      return [];
    }

    return correction.previousSlugs.map((previousSlug) => ({
      source: `/products/${previousSlug}`,
      destination: `/products/${correction.newSlug}`,
      permanent: true as const,
    }));
  });

function parseDocuments(documentPaths: string[]): ProductDocument[] {
  return documentPaths.flatMap((entry) => {
    const separator = entry.indexOf("|");
    if (separator <= 0) return [];
    const label = entry.slice(0, separator).trim();
    const url = entry.slice(separator + 1).trim();
    return label && url ? [{ label, url }] : [];
  });
}
