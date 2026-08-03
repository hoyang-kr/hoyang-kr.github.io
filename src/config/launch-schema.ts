import { z } from "zod";

export const siteReleaseModeSchema = z.enum([
  "development",
  "preview",
  "production",
]);

export type SiteReleaseMode = z.infer<typeof siteReleaseModeSchema>;

export const naverListingStatusSchema = z.enum([
  "active",
  "inactive",
  "coming-soon",
  "inquiry-only",
  "unverified",
]);

export type NaverListingStatus = z.infer<typeof naverListingStatusSchema>;

export const verificationStatusSchema = z.enum([
  "unverified",
  "verified",
  "rejected",
]);

export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const confirmationStatusSchema = z.enum([
  "unresolved",
  "confirmed",
  "not-applicable",
]);

export type ConfirmationStatus = z.infer<typeof confirmationStatusSchema>;

export const rightsStatusSchema = z.enum([
  "unverified",
  "confirmed",
  "restricted",
  "denied",
]);

export type RightsStatus = z.infer<typeof rightsStatusSchema>;

export const catalogConfirmationKeys = [
  "sacoSpelling",
  "hg513ImageRelationship",
  "hg1101Relationship",
  "hg110cRelationship",
  "hg110sRelationship",
  "hg112cRelationship",
  "hg112sRelationship",
  "hg822cRelationship",
  "hg822sRelationship",
  "hg999Relationship",
  "hg9992Relationship",
  "matteFinishMeaning",
  "duplicateBatutaBelairSatin",
  "duplicateBrioConcordSatin",
  "duplicateBrioConcordChrome",
  "hoyangBrandRelationship",
  "hoyangImageUsageRights",
  "productImageOwnership",
  "collectionOwnershipAndNamingRights",
  "trademarkUsageRights",
] as const;

export type CatalogConfirmationKey = (typeof catalogConfirmationKeys)[number];

const optionalText = z.string().optional().default("");
const requiredText = z.string();
const dateText = z
  .string()
  .refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "날짜는 YYYY-MM-DD 형식이어야 합니다.",
  );

export const brandIdentitySchema = z
  .object({
    brandNameKo: requiredText,
    brandNameEn: requiredText,
    legalCompanyNameKo: requiredText,
    legalCompanyNameEn: optionalText,
    logoPath: requiredText,
    logoAlt: requiredText,
    faviconPath: requiredText,
    heroImagePath: requiredText,
    heroImageAlt: requiredText,
    primaryBrandDescription: requiredText,
    shortBrandDescription: requiredText,
    establishedYear: z.number().int().min(1800).max(2200).nullable(),
    manufacturerRelationship: requiredText,
    hoyangRelationshipStatement: requiredText,
    imageRightsConfirmed: z.boolean(),
    trademarkRightsConfirmed: z.boolean(),
    productImageOwner: requiredText,
    productImageLicenseStatus: rightsStatusSchema,
    embeddedBrandName: requiredText,
    embeddedBrandRelationship: requiredText,
    permittedPublicUse: z.boolean(),
    permittedModification: z.boolean(),
    attributionRequired: z.boolean(),
    confirmationDocumentReference: requiredText,
  })
  .strict();

export const companyInformationSchema = z
  .object({
    representativeName: requiredText,
    businessRegistrationNumber: requiredText,
    mailOrderRegistrationRequired: z.boolean(),
    mailOrderRegistrationNumber: requiredText,
    businessAddress: requiredText,
    customerServicePhone: requiredText,
    faxNumber: requiredText,
    customerServiceEmail: requiredText,
    operatingHours: requiredText,
    privacyOfficer: requiredText,
    wholesaleInquiryEmail: optionalText,
    wholesaleInquiryPhone: optionalText,
  })
  .strict();

export const onlinePresenceSchema = z
  .object({
    productionDomain: requiredText,
    canonicalBaseUrl: requiredText,
    naverStoreHomepageUrl: requiredText,
    instagramUrl: optionalText,
    naverBlogUrl: optionalText,
    kakaoChannelUrl: optionalText,
    approvedNaverStoreHosts: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const customerPolicySchema = z
  .object({
    warrantySummary: requiredText,
    asPolicySummary: requiredText,
    returnExchangeSummary: requiredText,
    installationResponsibilityStatement: requiredText,
    productCareSummary: requiredText,
    deliveryInformationSummary: requiredText,
    customerSupportInstructions: requiredText,
  })
  .strict();

export const legalSectionSchema = z
  .object({
    heading: z.string().min(1),
    body: z.string().min(1),
  })
  .strict();

export const legalInformationSchema = z
  .object({
    privacyPolicyStatus: z.enum(["draft", "final"]),
    termsStatus: z.enum(["draft", "final"]),
    legalReviewCompleted: z.boolean(),
    legalReviewDate: dateText,
    legalReviewer: requiredText,
    privacyPolicyEffectiveDate: dateText,
    termsEffectiveDate: dateText,
    privacyPolicySections: z.array(legalSectionSchema),
    termsSections: z.array(legalSectionSchema),
  })
  .strict();

export const seoIdentitySchema = z
  .object({
    defaultTitle: requiredText,
    titleTemplate: requiredText,
    defaultDescription: requiredText,
    openGraphImage: requiredText,
    organizationName: requiredText,
    organizationLogo: requiredText,
    searchEngineVerification: z
      .object({
        google: optionalText,
        naver: optionalText,
        other: z.record(z.string(), z.string()),
      })
      .strict(),
  })
  .strict();

export const productLaunchRecordSchema = z
  .object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    verifiedProductNameKo: optionalText,
    verifiedCollection: optionalText,
    verifiedCategory: optionalText,
    modelNumber: optionalText,
    finish: optionalText,
    dimensions: optionalText,
    material: optionalText,
    installationMethod: optionalText,
    available: z.boolean(),
    documentPaths: z.array(z.string()),
    imagePath: optionalText,
    customerVisible: z.boolean(),
    verificationStatus: verificationStatusSchema,
    verifiedBy: optionalText,
    verificationDate: dateText,
    notes: optionalText,
  })
  .strict();

export type ProductLaunchRecord = z.infer<typeof productLaunchRecordSchema>;

export const naverLinkRecordSchema = z
  .object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    naverUrl: optionalText,
    listingStatus: naverListingStatusSchema,
    verifiedBy: optionalText,
    verificationDate: dateText,
    notes: optionalText,
  })
  .strict();

export type NaverLinkRecord = z.infer<typeof naverLinkRecordSchema>;

export const catalogConfirmationSchema = z
  .object({
    status: confirmationStatusSchema,
    confirmedBy: optionalText,
    confirmationDate: dateText,
    evidenceReference: optionalText,
    notes: optionalText,
  })
  .strict();

export type CatalogConfirmation = z.infer<typeof catalogConfirmationSchema>;

export const catalogCorrectionSchema = z
  .object({
    correctionId: z.string().min(1),
    status: verificationStatusSchema,
    productId: z.string().min(1),
    variantId: optionalText,
    displayNameKo: optionalText,
    collection: optionalText,
    category: optionalText,
    finish: optionalText,
    modelNumber: optionalText,
    imagePath: optionalText,
    customerVisible: z.boolean().nullable(),
    relatedProductIds: z.array(z.string()),
    newSlug: optionalText,
    previousSlugs: z.array(z.string()),
    targetProductId: optionalText,
    evidenceReference: optionalText,
    verifiedBy: optionalText,
    verificationDate: dateText,
    notes: optionalText,
  })
  .strict();

export type CatalogCorrection = z.infer<typeof catalogCorrectionSchema>;

const confirmationShape = Object.fromEntries(
  catalogConfirmationKeys.map((key) => [key, catalogConfirmationSchema]),
) as {
  [Key in CatalogConfirmationKey]: typeof catalogConfirmationSchema;
};

export const launchDataSchema = z
  .object({
    schemaVersion: z.literal(1),
    sourceHash: z.string(),
    brand: brandIdentitySchema,
    company: companyInformationSchema,
    online: onlinePresenceSchema,
    customerPolicy: customerPolicySchema,
    legal: legalInformationSchema,
    seo: seoIdentitySchema,
    deployment: z
      .object({
        releaseMode: siteReleaseModeSchema,
      })
      .strict(),
    products: z.array(productLaunchRecordSchema),
    naverLinks: z.array(naverLinkRecordSchema),
    catalogConfirmations: z.object(confirmationShape).strict(),
    catalogCorrections: z.array(catalogCorrectionSchema),
  })
  .strict();

export type LaunchData = z.infer<typeof launchDataSchema>;
