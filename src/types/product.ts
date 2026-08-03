import type {
  NaverListingStatus,
  VerificationStatus,
} from "@/config/launch-schema";

export type Finish = "사틴" | "크롬" | "블랙" | "무광" | "미확인";

export type CatalogReviewStatus =
  "verified" | "filename-derived" | "needs-confirmation";

export type ProductDocument = {
  label: string;
  url: string;
};

export type ProductVariant = {
  id: string;
  modelNumber: string;
  finish: Finish;
  image: string;
  gallery: string[];
  naverUrl?: string;
  naverListingStatus: NaverListingStatus;
  available: boolean;
  customerVisible: boolean;
  launchVerificationStatus: VerificationStatus;
  catalogReviewStatus: CatalogReviewStatus;
  documents?: ProductDocument[];
};

export type Product = {
  id: string;
  slug: string;
  nameKo: string;
  nameEn?: string;
  catalogSortOrder: number;
  collection?: string;
  collectionIds?: string[];
  legacySlugs?: string[];
  category: string;
  shortDescription?: string;
  description?: string;
  features: string[];
  variants: ProductVariant[];
  specifications: Record<string, string>;
  relatedProductIds: string[];
  featured: boolean;
  customerVisible: boolean;
  launchVerificationStatus: VerificationStatus;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
};

export type Collection = {
  id: string;
  slug: string;
  nameKo: string;
  nameEn: string;
  description: string;
  image: string;
  editorialReviewRequired: boolean;
};
