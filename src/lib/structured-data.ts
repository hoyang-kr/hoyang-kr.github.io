import { isProductionRelease, launchData } from "@/config/launch-data";
import { siteConfig } from "@/config/site";
import type { Product } from "@/types/product";

export function buildOrganizationStructuredData() {
  if (
    !isProductionRelease ||
    !launchData.brand.imageRightsConfirmed ||
    !launchData.brand.trademarkRightsConfirmed ||
    !launchData.seo.organizationName ||
    !launchData.seo.organizationLogo
  ) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: launchData.seo.organizationName,
    url: siteConfig.siteUrl,
    logo: new URL(
      launchData.seo.organizationLogo,
      siteConfig.siteUrl,
    ).toString(),
    ...(siteConfig.telephone !== "정보 준비 중"
      ? { telephone: siteConfig.telephone }
      : {}),
    ...(siteConfig.email !== "정보 준비 중" ? { email: siteConfig.email } : {}),
  };
}

export function buildProductStructuredData(product: Product) {
  if (
    product.launchVerificationStatus !== "verified" ||
    !launchData.brand.imageRightsConfirmed
  ) {
    return null;
  }

  const visibleVariants = product.variants.filter(
    (variant) =>
      variant.customerVisible &&
      variant.launchVerificationStatus === "verified",
  );
  if (visibleVariants.length === 0) return null;

  const models = [
    ...new Set(
      visibleVariants
        .map((variant) => variant.modelNumber)
        .filter((modelNumber) => modelNumber !== ""),
    ),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameKo,
    image: visibleVariants.map((variant) =>
      new URL(variant.image, siteConfig.siteUrl).toString(),
    ),
    ...(models.length === 1 ? { model: models[0] } : {}),
    color: visibleVariants.map((variant) => variant.finish).join(", "),
  };
}
