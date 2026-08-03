export type DealerType = "dealer" | "showroom";

export type Dealer = {
  id: string;
  nameKo: string;
  nameEn?: string;
  province: string;
  district: string;
  address: string;
  addressDetail?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  type: DealerType;
  operatingHours?: string;
  naverMapUrl?: string;
  kakaoMapUrl?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  isExample?: boolean;
  sortOrder?: number;
};

/** Public verified records and explicitly labeled visualization fixtures. */
export const dealers: Dealer[] = [
  {
    id: "seoul-station-display-example",
    nameKo: "서울역 대리점 표시 예시",
    nameEn: "DEALER DISPLAY EXAMPLE",
    province: "서울특별시",
    district: "용산구",
    address: "서울특별시 용산구 한강대로 405",
    latitude: 37.5548915897,
    longitude: 126.971746966,
    type: "dealer",
    naverMapUrl:
      "https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%9A%A9%EC%82%B0%EA%B5%AC%20%ED%95%9C%EA%B0%95%EB%8C%80%EB%A1%9C%20405",
    isActive: true,
    isExample: true,
    sortOrder: 1,
  },
];
