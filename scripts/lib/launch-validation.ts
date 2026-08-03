import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  catalogConfirmationKeys,
  launchDataSchema,
  type LaunchData,
} from "../../src/config/launch-schema";
import {
  isPlaceholderValue,
  isSafeHttpsUrl,
} from "../../src/config/launch-data";
import { categories } from "../../src/data/categories";
import { collections } from "../../src/data/collections";
import { sourceProducts } from "../../src/data/products";
import type { Finish } from "../../src/types/product";
import { projectRoot } from "./launch-data-files";

export type ValidationMode = "preview" | "production";

export type LaunchValidationResult = {
  mode: ValidationMode;
  errors: string[];
  warnings: string[];
};

const knownFinishes = new Set<Finish>([
  "사틴",
  "크롬",
  "블랙",
  "무광",
  "미확인",
]);

export function validateLaunchData(
  data: LaunchData,
  mode: ValidationMode,
): LaunchValidationResult {
  const structuralResult = launchDataSchema.safeParse(data);
  if (!structuralResult.success) {
    return {
      mode,
      errors: structuralResult.error.issues.map(
        (issue) =>
          `data/launch/launch-data.json:${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
      warnings: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  validateReferences(data, errors);
  validateUrls(data, errors);

  if (mode === "preview") {
    addPreviewWarnings(data, warnings);
  } else {
    validateProduction(data, errors);
  }

  return { mode, errors, warnings };
}

export function printValidationResult(result: LaunchValidationResult) {
  const label = result.mode === "production" ? "Production" : "Preview";
  if (result.errors.length === 0) {
    console.log(`${label} validation passed with 0 errors.`);
  } else {
    console.error(
      `${label} validation failed with ${result.errors.length} errors:`,
    );
    for (const error of result.errors) console.error(`- ${error}`);
  }
  if (result.warnings.length > 0) {
    console.warn(
      `${label} validation has ${result.warnings.length} documented warnings:`,
    );
    for (const warning of result.warnings) console.warn(`- ${warning}`);
  }
}

function validateReferences(data: LaunchData, errors: string[]) {
  const sourceProductsById = new Map(
    sourceProducts.map((product) => [product.id, product]),
  );
  const categoryIds = new Set(categories.map((category) => category.id));
  const collectionIds = new Set(collections.map((collection) => collection.id));
  const productRowKeys = new Set<string>();
  const naverRowKeys = new Set<string>();
  const naverUrls = new Map<string, string>();
  const productFamilyValues = new Map<string, Map<string, string>>();

  for (const [index, record] of data.products.entries()) {
    const path = `data/launch/products.csv:${index + 2}`;
    const key = `${record.productId}\u0000${record.variantId}`;
    if (productRowKeys.has(key)) {
      errors.push(
        `${path}: duplicate productId/variantId pair ${record.productId}/${record.variantId}`,
      );
    }
    productRowKeys.add(key);
    const product = sourceProductsById.get(record.productId);
    if (!product) {
      errors.push(`${path}: unknown productId "${record.productId}"`);
      continue;
    }
    if (!product.variants.some((variant) => variant.id === record.variantId)) {
      errors.push(
        `${path}: unknown variantId "${record.variantId}" for product "${record.productId}"`,
      );
    }
    if (
      record.verifiedCollection &&
      !collectionIds.has(record.verifiedCollection)
    ) {
      errors.push(
        `${path}: unknown verifiedCollection "${record.verifiedCollection}"`,
      );
    }
    if (record.verifiedCategory && !categoryIds.has(record.verifiedCategory)) {
      errors.push(
        `${path}: unknown verifiedCategory "${record.verifiedCategory}"`,
      );
    }
    if (record.finish && !knownFinishes.has(record.finish as Finish)) {
      errors.push(`${path}: unsupported finish "${record.finish}"`);
    }
    const familyValues =
      productFamilyValues.get(record.productId) ?? new Map<string, string>();
    const familyFields = [
      ["verifiedProductNameKo", record.verifiedProductNameKo],
      ["verifiedCollection", record.verifiedCollection],
      ["verifiedCategory", record.verifiedCategory],
      ["dimensions", record.dimensions],
      ["material", record.material],
      ["installationMethod", record.installationMethod],
    ] as const;
    for (const [field, value] of familyFields) {
      if (!value) continue;
      const existingValue = familyValues.get(field);
      if (existingValue && existingValue !== value) {
        errors.push(
          `${path}:${field}: conflicts with another row for product "${record.productId}" ("${existingValue}" versus "${value}")`,
        );
      } else {
        familyValues.set(field, value);
      }
    }
    productFamilyValues.set(record.productId, familyValues);
    for (const documentPath of record.documentPaths) {
      const separator = documentPath.indexOf("|");
      if (
        separator <= 0 ||
        !isSafePublicPath(documentPath.slice(separator + 1))
      ) {
        errors.push(
          `${path}: documentPaths entry "${documentPath}" must use label|/public-path format`,
        );
      }
    }
    if (record.imagePath && !isSafePublicPath(record.imagePath)) {
      errors.push(
        `${path}: imagePath "${record.imagePath}" must be an absolute public path without traversal`,
      );
    }
    if (
      record.verificationStatus === "verified" &&
      (!record.verifiedBy || !record.verificationDate)
    ) {
      errors.push(
        `${path}: verified rows require verifiedBy and verificationDate`,
      );
    }
  }

  for (const [index, record] of data.naverLinks.entries()) {
    const path = `data/launch/naver-links.csv:${index + 2}`;
    const key = `${record.productId}\u0000${record.variantId}`;
    if (naverRowKeys.has(key)) {
      errors.push(
        `${path}: duplicate productId/variantId pair ${record.productId}/${record.variantId}`,
      );
    }
    naverRowKeys.add(key);
    const product = sourceProductsById.get(record.productId);
    if (!product) {
      errors.push(`${path}: unknown productId "${record.productId}"`);
      continue;
    }
    if (!product.variants.some((variant) => variant.id === record.variantId)) {
      errors.push(
        `${path}: unknown variantId "${record.variantId}" for product "${record.productId}"`,
      );
    }
    if (record.naverUrl) {
      const existingKey = naverUrls.get(record.naverUrl);
      if (existingKey && existingKey !== key) {
        errors.push(
          `${path}: conflicting duplicate Naver URL also assigned to ${existingKey.replace("\u0000", "/")}`,
        );
      }
      naverUrls.set(record.naverUrl, key);
    }
    if (record.listingStatus === "active") {
      if (!record.naverUrl) {
        errors.push(`${path}: active listing requires naverUrl`);
      } else if (!isApprovedNaverUrlForData(data, record.naverUrl, true)) {
        errors.push(
          `${path}: active listing URL must use HTTPS, an approved Naver host, and a /products/ path`,
        );
      }
    } else if (record.naverUrl) {
      errors.push(
        `${path}: ${record.listingStatus} listings must not retain a clickable naverUrl`,
      );
    }
    if (
      record.listingStatus !== "unverified" &&
      (!record.verifiedBy || !record.verificationDate)
    ) {
      errors.push(
        `${path}: ${record.listingStatus} listings require verifiedBy and verificationDate`,
      );
    }
  }

  const correctionIds = new Set<string>();
  const effectiveSlugOwners = new Map(
    sourceProducts.map((product) => [product.slug, product.id]),
  );
  const redirectDestinations = new Map<string, string>();
  for (const [index, correction] of data.catalogCorrections.entries()) {
    const path = `data/launch/catalog-confirmations.yaml:catalogCorrections[${index}]`;
    if (correctionIds.has(correction.correctionId)) {
      errors.push(
        `${path}: duplicate correctionId "${correction.correctionId}"`,
      );
    }
    correctionIds.add(correction.correctionId);
    const product = sourceProductsById.get(correction.productId);
    if (!product) {
      errors.push(`${path}: unknown productId "${correction.productId}"`);
      continue;
    }
    if (
      correction.variantId &&
      !product.variants.some((variant) => variant.id === correction.variantId)
    ) {
      errors.push(
        `${path}: unknown variantId "${correction.variantId}" for product "${correction.productId}"`,
      );
    }
    if (correction.collection && !collectionIds.has(correction.collection)) {
      errors.push(`${path}: unknown collection "${correction.collection}"`);
    }
    if (correction.category && !categoryIds.has(correction.category)) {
      errors.push(`${path}: unknown category "${correction.category}"`);
    }
    if (correction.finish && !knownFinishes.has(correction.finish as Finish)) {
      errors.push(`${path}: unsupported finish "${correction.finish}"`);
    }
    for (const relatedProductId of correction.relatedProductIds) {
      if (!sourceProductsById.has(relatedProductId)) {
        errors.push(`${path}: unknown relatedProductId "${relatedProductId}"`);
      }
    }
    if (
      correction.targetProductId &&
      !sourceProductsById.has(correction.targetProductId)
    ) {
      errors.push(
        `${path}: unknown targetProductId "${correction.targetProductId}"`,
      );
    }
    if (
      correction.newSlug &&
      correction.newSlug !== product.slug &&
      !correction.previousSlugs.includes(product.slug)
    ) {
      errors.push(
        `${path}: slug changes must include the current slug "${product.slug}" in previousSlugs`,
      );
    }
    if (
      correction.newSlug &&
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(correction.newSlug)
    ) {
      errors.push(
        `${path}: newSlug "${correction.newSlug}" must use lowercase ASCII words separated by hyphens`,
      );
    }
    if (correction.status === "verified" && correction.newSlug) {
      const expectedOwner = correction.targetProductId || correction.productId;
      const existingOwner = effectiveSlugOwners.get(correction.newSlug);
      if (existingOwner && existingOwner !== expectedOwner) {
        errors.push(
          `${path}: newSlug "${correction.newSlug}" conflicts with product "${existingOwner}"`,
        );
      } else {
        effectiveSlugOwners.set(correction.newSlug, expectedOwner);
      }
      for (const previousSlug of correction.previousSlugs) {
        const existingDestination = redirectDestinations.get(previousSlug);
        if (existingDestination && existingDestination !== correction.newSlug) {
          errors.push(
            `${path}: previousSlug "${previousSlug}" already redirects to "${existingDestination}"`,
          );
        } else {
          redirectDestinations.set(previousSlug, correction.newSlug);
        }
      }
    }
    if (
      correction.targetProductId &&
      (!correction.variantId ||
        !correction.newSlug ||
        correction.previousSlugs.length === 0)
    ) {
      errors.push(
        `${path}: family/variant relationship corrections require variantId, newSlug, and previousSlugs`,
      );
    }
    if (
      correction.status === "verified" &&
      (!correction.verifiedBy ||
        !correction.verificationDate ||
        !correction.evidenceReference)
    ) {
      errors.push(
        `${path}: verified corrections require verifiedBy, verificationDate, and evidenceReference`,
      );
    }
  }
}

function validateUrls(data: LaunchData, errors: string[]) {
  if (
    data.online.canonicalBaseUrl &&
    !isSafeHttpsUrl(data.online.canonicalBaseUrl)
  ) {
    errors.push("data/launch/seo.yaml:canonicalOrigin: URL must use HTTPS");
  }
  if (
    data.online.productionDomain.includes("://") ||
    data.online.productionDomain.includes("/") ||
    /\s/.test(data.online.productionDomain)
  ) {
    errors.push(
      "data/launch/seo.yaml:productionDomain: expected a hostname without protocol, path, or spaces",
    );
  }

  const optionalUrls = [
    ["online.instagramUrl", data.online.instagramUrl],
    ["online.naverBlogUrl", data.online.naverBlogUrl],
    ["online.kakaoChannelUrl", data.online.kakaoChannelUrl],
  ] as const;
  for (const [field, value] of optionalUrls) {
    if (value && !isSafeHttpsUrl(value)) {
      errors.push(`data/launch/business.yaml:${field}: URL must use HTTPS`);
    }
  }

  const publicAssets = [
    ["brand.logoPath", data.brand.logoPath],
    ["brand.faviconPath", data.brand.faviconPath],
    ["brand.heroImagePath", data.brand.heroImagePath],
    ["seo.openGraphImage", data.seo.openGraphImage],
    ["seo.organizationLogo", data.seo.organizationLogo],
  ] as const;
  for (const [field, value] of publicAssets) {
    if (value && !(isSafePublicPath(value) || isSafeHttpsUrl(value))) {
      errors.push(
        `data/launch/launch-data.json:${field}: expected a safe public path or HTTPS URL`,
      );
    }
  }

  for (const host of data.online.approvedNaverStoreHosts) {
    if (
      host.includes("://") ||
      host.includes("/") ||
      host.includes("*") ||
      /\s/.test(host)
    ) {
      errors.push(
        `data/launch/business.yaml:online.approvedNaverStoreHosts: "${host}" must be an exact hostname`,
      );
    }
  }

  if (
    data.online.naverStoreHomepageUrl &&
    !isApprovedNaverUrlForData(data, data.online.naverStoreHomepageUrl, false)
  ) {
    errors.push(
      "data/launch/business.yaml:online.naverStoreHomepageUrl: must use HTTPS and an approved Naver host",
    );
  }
}

function addPreviewWarnings(data: LaunchData, warnings: string[]) {
  if (data.sourceHash === "unconfigured-preview-data") {
    warnings.push(
      "No verified launch-data import has been performed; active data is the controlled preview fallback.",
    );
  }
  const unresolvedConfirmations = catalogConfirmationKeys.filter(
    (key) => data.catalogConfirmations[key].status === "unresolved",
  );
  if (unresolvedConfirmations.length > 0) {
    warnings.push(
      `${unresolvedConfirmations.length} catalog/business confirmations remain unresolved: ${unresolvedConfirmations.join(", ")}`,
    );
  }
  if (data.products.length === 0) {
    warnings.push(
      "No verified product launch rows are loaded; source catalog values remain preview-only.",
    );
  }
  if (data.naverLinks.length === 0) {
    warnings.push(
      "No Naver listing rows are loaded; purchase controls remain disabled/unverified.",
    );
  }
  if (
    data.legal.privacyPolicyStatus !== "final" ||
    data.legal.termsStatus !== "final"
  ) {
    warnings.push("Legal pages are draft and remain noindex in preview.");
  }
}

function validateProduction(data: LaunchData, errors: string[]) {
  const effectiveReleaseMode =
    process.env.NEXT_PUBLIC_SITE_RELEASE_MODE ?? data.deployment.releaseMode;
  if (
    data.deployment.releaseMode !== "production" ||
    effectiveReleaseMode !== "production"
  ) {
    errors.push(
      'data/launch/business.yaml:deployment.releaseMode: active data and NEXT_PUBLIC_SITE_RELEASE_MODE must resolve to "production"',
    );
  }

  const requiredTextFields = [
    ["brand.brandNameKo", data.brand.brandNameKo],
    ["brand.brandNameEn", data.brand.brandNameEn],
    ["brand.legalCompanyNameKo", data.brand.legalCompanyNameKo],
    ["brand.logoPath", data.brand.logoPath],
    ["brand.logoAlt", data.brand.logoAlt],
    ["brand.faviconPath", data.brand.faviconPath],
    ["brand.heroImagePath", data.brand.heroImagePath],
    ["brand.heroImageAlt", data.brand.heroImageAlt],
    ["brand.primaryBrandDescription", data.brand.primaryBrandDescription],
    ["brand.shortBrandDescription", data.brand.shortBrandDescription],
    ["brand.manufacturerRelationship", data.brand.manufacturerRelationship],
    [
      "brand.hoyangRelationshipStatement",
      data.brand.hoyangRelationshipStatement,
    ],
    ["brand.productImageOwner", data.brand.productImageOwner],
    ["brand.embeddedBrandRelationship", data.brand.embeddedBrandRelationship],
    [
      "brand.confirmationDocumentReference",
      data.brand.confirmationDocumentReference,
    ],
    ["company.representativeName", data.company.representativeName],
    [
      "company.businessRegistrationNumber",
      data.company.businessRegistrationNumber,
    ],
    ["company.businessAddress", data.company.businessAddress],
    ["company.customerServicePhone", data.company.customerServicePhone],
    ["company.faxNumber", data.company.faxNumber],
    ["company.customerServiceEmail", data.company.customerServiceEmail],
    ["company.operatingHours", data.company.operatingHours],
    ["company.privacyOfficer", data.company.privacyOfficer],
    ["customerPolicy.warrantySummary", data.customerPolicy.warrantySummary],
    ["customerPolicy.asPolicySummary", data.customerPolicy.asPolicySummary],
    [
      "customerPolicy.returnExchangeSummary",
      data.customerPolicy.returnExchangeSummary,
    ],
    [
      "customerPolicy.installationResponsibilityStatement",
      data.customerPolicy.installationResponsibilityStatement,
    ],
    [
      "customerPolicy.productCareSummary",
      data.customerPolicy.productCareSummary,
    ],
    [
      "customerPolicy.deliveryInformationSummary",
      data.customerPolicy.deliveryInformationSummary,
    ],
    [
      "customerPolicy.customerSupportInstructions",
      data.customerPolicy.customerSupportInstructions,
    ],
    ["seo.defaultTitle", data.seo.defaultTitle],
    ["seo.titleTemplate", data.seo.titleTemplate],
    ["seo.defaultDescription", data.seo.defaultDescription],
    ["seo.openGraphImage", data.seo.openGraphImage],
    ["seo.organizationName", data.seo.organizationName],
    ["seo.organizationLogo", data.seo.organizationLogo],
  ] as const;
  for (const [field, value] of requiredTextFields) {
    if (isPlaceholderValue(value)) {
      errors.push(
        `data/launch/launch-data.json:${field}: verified production value is required`,
      );
    }
  }

  if (!/^\d{3}-\d{2}-\d{5}$/.test(data.company.businessRegistrationNumber)) {
    errors.push(
      "data/launch/launch-data.json:company.businessRegistrationNumber: expected NNN-NN-NNNNN format",
    );
  }
  if (
    data.company.mailOrderRegistrationRequired &&
    isPlaceholderValue(data.company.mailOrderRegistrationNumber)
  ) {
    errors.push(
      "data/launch/launch-data.json:company.mailOrderRegistrationNumber: required because mailOrderRegistrationRequired is true",
    );
  }
  if (!isEmail(data.company.customerServiceEmail)) {
    errors.push(
      "data/launch/launch-data.json:company.customerServiceEmail: valid customer-service email is required",
    );
  }
  if (!isPhone(data.company.customerServicePhone)) {
    errors.push(
      "data/launch/launch-data.json:company.customerServicePhone: valid customer-service telephone is required",
    );
  }
  if (!isPhone(data.company.faxNumber)) {
    errors.push(
      "data/launch/launch-data.json:company.faxNumber: valid fax number is required",
    );
  }
  if (
    !data.seo.titleTemplate.includes("%s") ||
    !/[가-힣]/.test(data.seo.defaultTitle) ||
    data.seo.defaultDescription.trim().length < 20 ||
    !/[가-힣]/.test(data.seo.defaultDescription)
  ) {
    errors.push(
      "data/launch/seo.yaml: final title template must contain %s and default Korean title/description must be meaningful",
    );
  }
  if (
    data.company.wholesaleInquiryEmail &&
    !isEmail(data.company.wholesaleInquiryEmail)
  ) {
    errors.push(
      "data/launch/launch-data.json:company.wholesaleInquiryEmail: optional value must be a valid email",
    );
  }
  if (
    data.company.wholesaleInquiryPhone &&
    !isPhone(data.company.wholesaleInquiryPhone)
  ) {
    errors.push(
      "data/launch/launch-data.json:company.wholesaleInquiryPhone: optional value must be a valid telephone",
    );
  }

  validateProductionOrigin(data, errors);
  validateProductionAssets(data, errors);

  if (!data.brand.imageRightsConfirmed) {
    errors.push(
      "data/launch/launch-data.json:brand.imageRightsConfirmed: must be true",
    );
  }
  if (!data.brand.trademarkRightsConfirmed) {
    errors.push(
      "data/launch/launch-data.json:brand.trademarkRightsConfirmed: must be true",
    );
  }
  if (data.brand.productImageLicenseStatus !== "confirmed") {
    errors.push(
      "data/launch/launch-data.json:brand.productImageLicenseStatus: must be confirmed",
    );
  }
  if (!data.brand.permittedPublicUse) {
    errors.push(
      "data/launch/launch-data.json:brand.permittedPublicUse: must be true",
    );
  }

  if (
    !data.online.naverStoreHomepageUrl ||
    !isApprovedNaverUrlForData(data, data.online.naverStoreHomepageUrl, false)
  ) {
    errors.push(
      "data/launch/launch-data.json:online.naverStoreHomepageUrl: verified approved Naver Store homepage is required",
    );
  }

  if (
    data.legal.privacyPolicyStatus !== "final" ||
    data.legal.privacyPolicySections.length === 0 ||
    !data.legal.privacyPolicyEffectiveDate
  ) {
    errors.push(
      "data/launch/launch-data.json:legal.privacyPolicyStatus: final reviewed sections and effective date are required",
    );
  }
  if (
    data.legal.termsStatus !== "final" ||
    data.legal.termsSections.length === 0 ||
    !data.legal.termsEffectiveDate
  ) {
    errors.push(
      "data/launch/launch-data.json:legal.termsStatus: final reviewed sections and effective date are required",
    );
  }
  if (
    !data.legal.legalReviewCompleted ||
    !data.legal.legalReviewDate ||
    !data.legal.legalReviewer
  ) {
    errors.push(
      "data/launch/launch-data.json:legal: completed legal review, date, and reviewer are required",
    );
  }

  for (const key of catalogConfirmationKeys) {
    const confirmation = data.catalogConfirmations[key];
    if (confirmation.status === "unresolved") {
      errors.push(
        `data/launch/catalog-confirmations.yaml:confirmations.${key}: unresolved production blocker`,
      );
    } else if (
      !confirmation.confirmedBy ||
      !confirmation.confirmationDate ||
      !confirmation.evidenceReference
    ) {
      errors.push(
        `data/launch/catalog-confirmations.yaml:confirmations.${key}: resolved entries require confirmedBy, confirmationDate, and evidenceReference`,
      );
    }
  }

  validateProductionCatalog(data, errors);
}

function validateProductionOrigin(data: LaunchData, errors: string[]) {
  if (
    !data.online.productionDomain ||
    /localhost|example|your-domain/i.test(data.online.productionDomain)
  ) {
    errors.push(
      "data/launch/launch-data.json:online.productionDomain: real production domain is required",
    );
  }
  try {
    const canonical = new URL(data.online.canonicalBaseUrl);
    if (
      canonical.protocol !== "https:" ||
      canonical.pathname !== "/" ||
      canonical.search ||
      canonical.hash ||
      canonical.hostname !== data.online.productionDomain ||
      /localhost|example|your-domain/i.test(canonical.hostname)
    ) {
      throw new Error("invalid production origin");
    }
    const configuredSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? data.online.canonicalBaseUrl;
    if (new URL(configuredSiteUrl).origin !== canonical.origin) {
      errors.push(
        "environment:NEXT_PUBLIC_SITE_URL: must match online.canonicalBaseUrl",
      );
    }
  } catch {
    errors.push(
      "data/launch/launch-data.json:online.canonicalBaseUrl: must be the HTTPS origin for productionDomain with no path, query, or fragment",
    );
  }
}

function validateProductionAssets(data: LaunchData, errors: string[]) {
  const assets = [
    ["brand.logoPath", data.brand.logoPath],
    ["brand.faviconPath", data.brand.faviconPath],
    ["brand.heroImagePath", data.brand.heroImagePath],
    ["seo.openGraphImage", data.seo.openGraphImage],
    ["seo.organizationLogo", data.seo.organizationLogo],
  ] as const;
  for (const [field, value] of assets) {
    if (/placeholder/i.test(value)) {
      errors.push(
        `data/launch/launch-data.json:${field}: placeholder asset is not allowed`,
      );
      continue;
    }
    if (
      value.startsWith("/") &&
      !existsSync(resolve(projectRoot, "public", `.${value}`))
    ) {
      errors.push(
        `data/launch/launch-data.json:${field}: public asset does not exist at ${value}`,
      );
    } else if (!value.startsWith("/") && !isSafeHttpsUrl(value)) {
      errors.push(
        `data/launch/launch-data.json:${field}: expected public path or HTTPS URL`,
      );
    }
  }
}

function validateProductionCatalog(data: LaunchData, errors: string[]) {
  const productRows = new Map(
    data.products.map((record) => [
      `${record.productId}\u0000${record.variantId}`,
      record,
    ]),
  );
  const naverRows = new Map(
    data.naverLinks.map((record) => [
      `${record.productId}\u0000${record.variantId}`,
      record,
    ]),
  );
  const visibleTitleOwners = new Map<string, string>();

  for (const record of data.products) {
    if (
      record.verificationStatus !== "verified" ||
      !record.customerVisible ||
      !record.verifiedProductNameKo
    ) {
      continue;
    }
    const existingOwner = visibleTitleOwners.get(record.verifiedProductNameKo);
    if (existingOwner && existingOwner !== record.productId) {
      errors.push(
        `data/launch/products.csv:${record.productId}/${record.variantId}: customer-visible title "${record.verifiedProductNameKo}" duplicates product "${existingOwner}"`,
      );
    } else {
      visibleTitleOwners.set(record.verifiedProductNameKo, record.productId);
    }
  }

  for (const product of sourceProducts) {
    for (const variant of product.variants) {
      const key = `${product.id}\u0000${variant.id}`;
      const productRow = productRows.get(key);
      const path = `${product.id}/${variant.id}`;
      if (!productRow || productRow.verificationStatus !== "verified") {
        errors.push(
          `data/launch/products.csv:${path}: customer-visible catalog variant requires a verified row`,
        );
      } else if (
        isPlaceholderValue(productRow.verifiedProductNameKo) ||
        !productRow.verifiedCollection ||
        !productRow.verifiedCategory ||
        !productRow.finish ||
        productRow.finish === "미확인" ||
        isPlaceholderValue(productRow.finish)
      ) {
        errors.push(
          `data/launch/products.csv:${path}: verified non-placeholder customer fields name, collection, category, and finish are required`,
        );
      }
      if (
        productRow?.verificationStatus === "verified" &&
        !productRow.customerVisible
      ) {
        continue;
      }
      const effectiveImage = productRow?.imagePath || variant.image;
      if (
        effectiveImage.includes("placeholder") ||
        effectiveImage.includes("finish-pending") ||
        effectiveImage.endsWith(".svg") ||
        !existsSync(resolve(projectRoot, "public", `.${effectiveImage}`))
      ) {
        errors.push(
          `data/launch/products.csv:${path}: customer-visible variant uses a missing or placeholder image`,
        );
      }

      const naverRow = naverRows.get(key);
      if (!naverRow || naverRow.listingStatus === "unverified") {
        errors.push(
          `data/launch/naver-links.csv:${path}: customer-visible variant requires a verified listing state`,
        );
        continue;
      }
      if (
        productRow?.available &&
        naverRow.listingStatus !== "active" &&
        naverRow.listingStatus !== "inquiry-only"
      ) {
        errors.push(
          `data/launch/naver-links.csv:${path}: available variant requires an active URL or inquiry-only classification`,
        );
      }
      if (
        naverRow.listingStatus === "active" &&
        (!productRow?.available ||
          !isApprovedNaverUrlForData(data, naverRow.naverUrl, true))
      ) {
        errors.push(
          `data/launch/naver-links.csv:${path}: active listing requires available=true and a valid approved product URL`,
        );
      }
    }
  }
}

function isApprovedNaverUrlForData(
  data: LaunchData,
  value: string,
  requireProduct: boolean,
) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      data.online.approvedNaverStoreHosts.includes(url.hostname) &&
      (!requireProduct || url.pathname.includes("/products/"))
    );
  } catch {
    return false;
  }
}

function isSafePublicPath(value: string) {
  return (
    value.startsWith("/") && !value.includes("..") && !value.includes("\\")
  );
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string) {
  return /^[+()\d\s-]+$/.test(value) && value.replace(/\D/g, "").length >= 7;
}
