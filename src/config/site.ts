import { launchData, siteReleaseMode } from "@/config/launch-data";

export const siteConfig = {
  releaseMode: siteReleaseMode,
  brandNameKo: launchData.brand.brandNameKo,
  brandNameEn: launchData.brand.brandNameEn,
  logoPath: launchData.brand.logoPath,
  logoAlt: launchData.brand.logoAlt,
  faviconPath: launchData.brand.faviconPath,
  heroImagePath: launchData.brand.heroImagePath,
  heroImageAlt: launchData.brand.heroImageAlt,
  companyDescription: launchData.brand.primaryBrandDescription,
  shortBrandDescription: launchData.brand.shortBrandDescription,
  telephone: launchData.company.customerServicePhone,
  fax: launchData.company.faxNumber,
  email: launchData.company.customerServiceEmail,
  address: launchData.company.businessAddress,
  operatingHours: launchData.company.operatingHours,
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? launchData.online.canonicalBaseUrl,
  productionDomain: launchData.online.productionDomain,
  naverSmartStoreUrl: launchData.online.naverStoreHomepageUrl,
  instagramUrl: launchData.online.instagramUrl,
  naverBlogUrl: launchData.online.naverBlogUrl,
  kakaoChannelUrl: launchData.online.kakaoChannelUrl,
  seo: launchData.seo,
  legal: launchData.legal,
  customerPolicy: launchData.customerPolicy,
  business: {
    companyName: launchData.brand.legalCompanyNameKo,
    representative: launchData.company.representativeName,
    registrationNumber: launchData.company.businessRegistrationNumber,
    mailOrderRegistrationRequired:
      launchData.company.mailOrderRegistrationRequired,
    mailOrderRegistrationNumber: launchData.company.mailOrderRegistrationNumber,
    privacyOfficer: launchData.company.privacyOfficer,
    wholesaleInquiryEmail: launchData.company.wholesaleInquiryEmail,
    wholesaleInquiryPhone: launchData.company.wholesaleInquiryPhone,
  },
} as const;

export const mainNavigation = [
  { label: "제품", href: "/products" },
  { label: "컬렉션", href: "/collections" },
  { label: "마감", href: "/products?finish=사틴" },
  { label: "브랜드", href: "/about" },
  { label: "고객지원", href: "/support" },
] as const;
