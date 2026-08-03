import type { Category } from "@/types/product";

export const categories: Category[] = [
  {
    id: "towel-bars",
    slug: "towel-bars",
    name: "수건걸이",
    shortName: "수건걸이",
    description: "수건걸이 제품을 컬렉션과 마감별로 확인할 수 있습니다.",
  },
  {
    id: "towel-shelves",
    slug: "towel-shelves",
    name: "수건선반",
    shortName: "수건선반",
    description: "이단 수건선반 제품을 모델과 마감별로 확인할 수 있습니다.",
  },
  {
    id: "toilet-paper-holders",
    slug: "toilet-paper-holders",
    name: "휴지걸이",
    shortName: "휴지걸이",
    description: "컬렉션과 마감별 휴지걸이 제품을 확인할 수 있습니다.",
  },
  {
    id: "recessed-holders",
    slug: "recessed-holders",
    name: "매립형 휴지걸이",
    shortName: "매립형 휴지걸이",
    description: "매립형 휴지걸이 제품을 모델별로 확인할 수 있습니다.",
  },
  {
    id: "shelves-storage",
    slug: "shelves-storage",
    name: "선반 및 수납",
    shortName: "선반 및 수납",
    description: "욕실용 선반과 수납 제품을 모아 소개합니다.",
  },
  {
    id: "bath-accessories",
    slug: "bath-accessories",
    name: "옷걸이 및 슬리퍼 걸이",
    shortName: "옷걸이 및 슬리퍼 걸이",
    description: "옷걸이와 슬리퍼 걸이 제품을 모아 소개합니다.",
  },
  {
    id: "shower-accessories",
    slug: "shower-accessories",
    name: "슬라이드바",
    shortName: "슬라이드바",
    description: "슬라이드바 제품을 모델별로 확인할 수 있습니다.",
  },
  {
    id: "cleaning",
    slug: "cleaning",
    name: "청소솔",
    shortName: "청소솔",
    description: "등록된 청소솔 제품을 확인할 수 있습니다.",
  },
  {
    id: "mirrors",
    slug: "mirrors",
    name: "면도경",
    shortName: "면도경",
    description: "등록된 면도경 제품을 확인할 수 있습니다.",
  },
];

export const homepageCategoryIds = [
  "towel-bars",
  "towel-shelves",
  "toilet-paper-holders",
  "recessed-holders",
  "shelves-storage",
  "bath-accessories",
  "mirrors",
] as const;

export function getCategory(id: string) {
  return categories.find((category) => category.id === id);
}
