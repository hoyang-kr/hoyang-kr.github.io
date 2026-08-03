import type { Finish, Product, ProductVariant } from "@/types/product";
import { applyCatalogOverrides } from "@/data/catalog-overrides";
import { homepageFeaturedProductConfigs } from "@/data/homepage-products";
import { getProductImageMapping } from "@/data/image-mapping";

const featuredProductIdSet = new Set(
  homepageFeaturedProductConfigs.map(({ id }) => id),
);

const finishFileNames: Record<Finish, string> = {
  사틴: "satin",
  크롬: "chrome",
  블랙: "black",
  무광: "matte",
  미확인: "finish-pending",
};

type VariantInput = {
  finish: Finish;
  modelNumber?: string;
  imageBase: string;
};

function variant({
  finish,
  modelNumber = "",
  imageBase,
}: VariantInput): ProductVariant {
  const suffix = finishFileNames[finish];
  const variantId = `${imageBase}-${suffix}`;
  const placeholderImage = `/images/products/${variantId}.svg`;
  const imageMapping = getProductImageMapping(variantId);
  const image =
    imageMapping?.useInCatalog === true
      ? imageMapping.normalizedPath
      : placeholderImage;

  return {
    id: variantId,
    modelNumber,
    finish,
    image,
    gallery: [image],
    naverListingStatus: "unverified",
    available: false,
    customerVisible: true,
    launchVerificationStatus: "unverified",
    catalogReviewStatus: imageMapping?.reviewStatus ?? "needs-confirmation",
  };
}

type NamedProductInput = {
  id: string;
  slug: string;
  name: string;
  collection: string;
  collectionIds?: string[];
  legacySlugs?: string[];
  category: string;
  folder: string;
  finishes: Finish[];
  relatedProductIds: string[];
  catalogSortOrder?: number;
};

function namedProduct({
  id,
  slug,
  name,
  collection,
  collectionIds,
  legacySlugs,
  category,
  folder,
  finishes,
  relatedProductIds,
  catalogSortOrder = Number.MAX_SAFE_INTEGER,
}: NamedProductInput): Product {
  return {
    id,
    slug,
    nameKo: name,
    catalogSortOrder,
    collection,
    collectionIds,
    legacySlugs,
    category,
    shortDescription: `${name}의 마감 옵션을 확인해 보세요.`,
    features: [],
    variants: finishes.map((finish) =>
      variant({ finish, imageBase: `${folder}/${slug}` }),
    ),
    specifications: {},
    relatedProductIds,
    featured: featuredProductIdSet.has(id),
    customerVisible: true,
    launchVerificationStatus: "unverified",
  };
}

type HgProductInput = {
  model: string;
  displayModel?: string;
  slug: string;
  name: string;
  category: string;
  finishes: Finish[];
  relatedProductIds: string[];
  catalogSortOrder?: number;
  variantModels?: Partial<Record<Finish, string>>;
  imageBase?: string;
};

function hgProduct({
  model,
  displayModel,
  slug,
  name,
  category,
  finishes,
  relatedProductIds,
  catalogSortOrder = Number.MAX_SAFE_INTEGER,
  variantModels,
  imageBase,
}: HgProductInput): Product {
  const publicModel = displayModel ?? model;
  const productName = `${publicModel} ${name}`;
  const id = model.toLowerCase().replaceAll("-", "");
  return {
    id,
    slug,
    nameKo: productName,
    catalogSortOrder,
    collection: "hg-series",
    category,
    shortDescription: `${name} 제품의 등록된 마감 정보를 확인해 보세요.`,
    features: [],
    variants: finishes.map((finish) =>
      variant({
        finish,
        modelNumber: variantModels?.[finish] ?? publicModel,
        imageBase: `hg/${imageBase ?? slug}`,
      }),
    ),
    specifications: {},
    relatedProductIds,
    featured: featuredProductIdSet.has(id),
    customerVisible: true,
    launchVerificationStatus: "unverified",
  };
}

export const sourceProducts: Product[] = [
  namedProduct({
    id: "batuta-towel-bar",
    slug: "batuta-towel-bar",
    name: "바투타 수건걸이",
    collection: "batuta",
    category: "towel-bars",
    folder: "batuta",
    finishes: ["사틴"],
    relatedProductIds: ["batuta-paper-holder"],
    catalogSortOrder: 10,
  }),
  namedProduct({
    id: "batuta-paper-holder",
    slug: "batuta-toilet-paper-holder",
    legacySlugs: ["belair-toilet-paper-holder"],
    name: "바투타/벨레어 휴지걸이",
    collection: "batuta",
    collectionIds: ["batuta", "belair"],
    category: "toilet-paper-holders",
    folder: "batuta",
    finishes: ["사틴"],
    relatedProductIds: ["batuta-towel-bar", "belair-towel-bar"],
  }),
  namedProduct({
    id: "belair-towel-bar",
    slug: "belair-towel-bar",
    name: "벨레어 수건걸이",
    collection: "belair",
    category: "towel-bars",
    folder: "belair",
    finishes: ["사틴"],
    relatedProductIds: ["batuta-paper-holder"],
    catalogSortOrder: 20,
  }),
  namedProduct({
    id: "brio-towel-bar",
    slug: "brio-towel-bar",
    name: "브리오 수건걸이",
    collection: "brio",
    category: "towel-bars",
    folder: "brio",
    finishes: ["사틴", "크롬"],
    relatedProductIds: ["brio-paper-holder", "brio-bp-paper-holder"],
    catalogSortOrder: 50,
  }),
  namedProduct({
    id: "brio-paper-holder",
    slug: "brio-toilet-paper-holder",
    name: "브리오 휴지걸이",
    collection: "brio",
    category: "toilet-paper-holders",
    folder: "brio",
    finishes: ["사틴", "크롬"],
    relatedProductIds: ["brio-towel-bar"],
  }),
  namedProduct({
    id: "brio-bp-paper-holder",
    slug: "brio-bp-toilet-paper-holder",
    name: "브리오BP 휴지걸이",
    collection: "brio",
    category: "toilet-paper-holders",
    folder: "brio",
    finishes: ["크롬"],
    relatedProductIds: ["brio-towel-bar"],
  }),
  namedProduct({
    id: "saco-towel-bar",
    slug: "saco-towel-bar",
    name: "사코 수건걸이",
    collection: "saco",
    category: "towel-bars",
    folder: "saco",
    finishes: ["블랙", "크롬"],
    relatedProductIds: ["saco-paper-holder"],
    catalogSortOrder: 30,
  }),
  namedProduct({
    id: "saco-paper-holder",
    slug: "saco-toilet-paper-holder",
    name: "사코 휴지걸이",
    collection: "saco",
    category: "toilet-paper-holders",
    folder: "saco",
    finishes: ["블랙", "크롬"],
    relatedProductIds: ["saco-towel-bar"],
  }),
  namedProduct({
    id: "concord-towel-bar",
    slug: "concord-towel-bar",
    name: "콩코드 수건걸이",
    collection: "concord",
    category: "towel-bars",
    folder: "concord",
    finishes: ["사틴", "크롬"],
    relatedProductIds: ["concord-paper-holder"],
    catalogSortOrder: 40,
  }),
  namedProduct({
    id: "concord-paper-holder",
    slug: "concord-toilet-paper-holder",
    name: "콩코드 휴지걸이",
    collection: "concord",
    category: "toilet-paper-holders",
    folder: "concord",
    finishes: ["사틴", "크롬"],
    relatedProductIds: ["concord-towel-bar"],
  }),
  hgProduct({
    model: "HG01MS",
    slug: "hg01ms-slide-bar",
    name: "슬라이드바",
    category: "shower-accessories",
    finishes: ["무광"],
    relatedProductIds: ["hg100ms", "hg392ms"],
  }),
  hgProduct({
    model: "HG05",
    displayModel: "HG05S",
    slug: "hg05-robe-hook",
    name: "옷걸이",
    category: "bath-accessories",
    finishes: ["사틴"],
    relatedProductIds: ["hg55s"],
  }),
  hgProduct({
    model: "HG55S",
    slug: "hg55s-slipper-rack",
    name: "슬리퍼걸이",
    category: "bath-accessories",
    finishes: ["사틴"],
    relatedProductIds: ["hg05"],
  }),
  hgProduct({
    model: "HG100MS",
    slug: "hg100ms-corner-shelf",
    name: "코너선반",
    category: "shelves-storage",
    finishes: ["무광"],
    relatedProductIds: ["hg392ms", "hg01ms"],
  }),
  hgProduct({
    model: "HG110-1",
    slug: "hg110-1-recessed-holder",
    name: "매립휴지걸이",
    category: "recessed-holders",
    finishes: ["크롬"],
    relatedProductIds: ["hg110c", "hg110s"],
  }),
  hgProduct({
    model: "HG110C",
    slug: "hg110c-recessed-holder",
    name: "매립휴지걸이",
    category: "recessed-holders",
    finishes: ["크롬"],
    relatedProductIds: ["hg1101", "hg110s"],
  }),
  hgProduct({
    model: "HG110S",
    slug: "hg110s-recessed-holder",
    name: "매립휴지걸이",
    category: "recessed-holders",
    finishes: ["사틴"],
    relatedProductIds: ["hg1101", "hg110c"],
  }),
  hgProduct({
    model: "HG112C",
    slug: "hg112c-tray-recessed-holder",
    name: "트레이 겸용 매립휴지걸이",
    category: "recessed-holders",
    finishes: ["크롬"],
    relatedProductIds: ["hg112s", "hg240"],
  }),
  hgProduct({
    model: "HG112S",
    slug: "hg112s-tray-recessed-holder",
    name: "트레이 겸용 매립휴지걸이",
    category: "recessed-holders",
    finishes: ["사틴"],
    relatedProductIds: ["hg112c", "hg240"],
  }),
  hgProduct({
    model: "HG120",
    slug: "hg120-single-paper-holder",
    name: "일단휴지걸이",
    category: "toilet-paper-holders",
    finishes: ["크롬"],
    relatedProductIds: ["hg240"],
  }),
  hgProduct({
    model: "HG240",
    slug: "hg240-phone-tray-recessed-holder",
    name: "폰&트레이 매립휴지걸이",
    category: "recessed-holders",
    finishes: ["크롬"],
    relatedProductIds: ["hg112c", "hg112s"],
  }),
  hgProduct({
    model: "HG392MS",
    slug: "hg392ms-premium-shelf",
    name: "고급형선반",
    category: "shelves-storage",
    finishes: ["무광"],
    relatedProductIds: ["hg100ms"],
  }),
  hgProduct({
    model: "HG513",
    slug: "hg513-cleaning-brush",
    name: "청소솔",
    category: "cleaning",
    finishes: ["사틴", "크롬"],
    relatedProductIds: [],
  }),
  hgProduct({
    model: "HG820",
    displayModel: "HG820C",
    slug: "hg820-double-towel-shelf",
    name: "이단수건선반",
    category: "towel-shelves",
    finishes: ["크롬"],
    relatedProductIds: ["hg822c", "hg822s"],
    catalogSortOrder: 80,
  }),
  hgProduct({
    model: "HG822C",
    slug: "hg822c-double-towel-shelf",
    name: "이단수건선반",
    category: "towel-shelves",
    finishes: ["크롬"],
    relatedProductIds: ["hg822s", "hg820"],
    catalogSortOrder: 60,
    imageBase: "hg822-double-towel-shelf",
  }),
  hgProduct({
    model: "HG822S",
    slug: "hg822s-double-towel-shelf",
    name: "이단수건선반",
    category: "towel-shelves",
    finishes: ["사틴"],
    relatedProductIds: ["hg822c", "hg820"],
    catalogSortOrder: 70,
    imageBase: "hg822-double-towel-shelf",
  }),
  hgProduct({
    model: "HG999",
    slug: "hg999-shaving-mirror",
    name: "면도경",
    category: "mirrors",
    finishes: ["크롬"],
    relatedProductIds: ["hg9992"],
  }),
  hgProduct({
    model: "HG999-2",
    slug: "hg999-2-shaving-mirror",
    name: "면도경",
    category: "mirrors",
    finishes: ["사틴"],
    relatedProductIds: ["hg999"],
  }),
];

export const products = applyCatalogOverrides(sourceProducts)
  .filter((product) => product.customerVisible)
  .sort((a, b) => a.catalogSortOrder - b.catalogSortOrder);

export const finishes: Finish[] = ["사틴", "크롬", "블랙", "무광"];

export function getProductBySlug(slug: string) {
  return products.find(
    (product) => product.slug === slug || product.legacySlugs?.includes(slug),
  );
}

export function getProductsByIds(ids: string[]) {
  return ids
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);
}
