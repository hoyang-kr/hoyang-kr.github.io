import type { Dealer } from "@/data/dealers";

export const DEALERS_PER_PAGE = 12;

export type DealerFilters = {
  province: string;
  district: string;
  query: string;
};

export const EMPTY_DEALER_FILTERS: DealerFilters = {
  province: "",
  district: "",
  query: "",
};

export function normalizeDealerSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

export function sortDealers(items: readonly Dealer[]) {
  return [...items].sort((a, b) => {
    const orderDifference = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return orderDifference || a.nameKo.localeCompare(b.nameKo, "ko");
  });
}

export function filterDealers(
  items: readonly Dealer[],
  filters: DealerFilters = EMPTY_DEALER_FILTERS,
) {
  const query = normalizeDealerSearchText(filters.query);
  return sortDealers(
    items.filter((dealer) => {
      if (dealer.isActive === false) return false;
      if (filters.province && dealer.province !== filters.province)
        return false;
      if (filters.district && dealer.district !== filters.district)
        return false;
      if (!query) return true;
      const searchable = normalizeDealerSearchText(
        [
          dealer.nameKo,
          dealer.nameEn,
          dealer.province,
          dealer.district,
          dealer.address,
          dealer.addressDetail,
        ]
          .filter(Boolean)
          .join(" "),
      );
      return searchable.includes(query);
    }),
  );
}

export function getProvinceOptions(items: readonly Dealer[]) {
  return [
    ...new Set(filterDealers(items).map((dealer) => dealer.province)),
  ].sort((a, b) => a.localeCompare(b, "ko"));
}

export function getDistrictOptions(items: readonly Dealer[], province: string) {
  if (!province) return [];
  return [
    ...new Set(
      filterDealers(items, { ...EMPTY_DEALER_FILTERS, province }).map(
        (dealer) => dealer.district,
      ),
    ),
  ].sort((a, b) => a.localeCompare(b, "ko"));
}

export function changeDealerProvince(
  filters: DealerFilters,
  province: string,
): DealerFilters {
  return { ...filters, province, district: "" };
}

export function resetDealerFilters(): DealerFilters {
  return { ...EMPTY_DEALER_FILTERS };
}

export function paginateDealers(
  items: readonly Dealer[],
  page: number,
  perPage = DEALERS_PER_PAGE,
) {
  const pageCount = Math.ceil(items.length / perPage);
  const safePage = pageCount === 0 ? 1 : Math.min(Math.max(page, 1), pageCount);
  return {
    items: items.slice((safePage - 1) * perPage, safePage * perPage),
    page: safePage,
    pageCount,
  };
}

export function normalizeTelephone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}
