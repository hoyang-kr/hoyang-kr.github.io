import type { Collection } from "@/types/product";

// 영문명과 slug는 사업자 확인 전까지 임시 값입니다.
export const collections: Collection[] = [
  {
    id: "batuta",
    slug: "batuta",
    nameKo: "바투타",
    nameEn: "battuta",
    description: "바투타 제품을 한 자리에서 살펴볼 수 있는 컬렉션입니다.",
    image: "/images/products/batuta/batuta-towel-bar-satin.jpg",
    editorialReviewRequired: true,
  },
  {
    id: "belair",
    slug: "belair",
    nameKo: "벨레어",
    nameEn: "Belair",
    description: "벨레어의 수건걸이와 휴지걸이를 마감별로 소개합니다.",
    image: "/images/products/belair/belair-towel-bar-satin.jpg",
    editorialReviewRequired: true,
  },
  {
    id: "brio",
    slug: "brio",
    nameKo: "브리오",
    nameEn: "Brio",
    description: "브리오 제품군의 구성과 마감 옵션을 둘러보세요.",
    image: "/images/products/brio/brio-towel-bar-satin.jpg",
    editorialReviewRequired: true,
  },
  {
    id: "saco",
    slug: "saco",
    nameKo: "사코",
    nameEn: "Saco",
    description: "블랙과 크롬 마감으로 구성된 사코 제품을 소개합니다.",
    image: "/images/products/saco/saco-towel-bar-black.jpg",
    editorialReviewRequired: true,
  },
  {
    id: "concord",
    slug: "concord",
    nameKo: "콩코드",
    nameEn: "Concord",
    description: "사틴과 크롬 마감의 콩코드 제품군을 만나보세요.",
    image: "/images/products/concord/concord-towel-bar-chrome.jpg",
    editorialReviewRequired: true,
  },
  {
    id: "hg-series",
    slug: "hg-series",
    nameKo: "HG 시리즈",
    nameEn: "HG Series",
    description: "다양한 욕실 사용 장면을 위한 HG 제품군입니다.",
    image: "/images/products/hg/hg822-double-towel-shelf-chrome.jpg",
    editorialReviewRequired: true,
  },
];

export function getCollection(idOrSlug: string) {
  return collections.find(
    (collection) => collection.id === idOrSlug || collection.slug === idOrSlug,
  );
}
