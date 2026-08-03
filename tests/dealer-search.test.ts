import assert from "node:assert/strict";
import test from "node:test";

import { dealers, type Dealer } from "@/data/dealers";
import {
  changeDealerProvince,
  EMPTY_DEALER_FILTERS,
  filterDealers,
  getDistrictOptions,
  paginateDealers,
  resetDealerFilters,
} from "@/lib/dealer-search";

const fixtures: Dealer[] = [
  {
    id: "a",
    nameKo: "가나다 상사",
    nameEn: "Alpha Dealer",
    province: "서울특별시",
    district: "강남구",
    address: "서울특별시 강남구 테헤란로 1",
    phone: "02-111-1111",
    latitude: 37.5,
    longitude: 127.03,
    type: "dealer",
    sortOrder: 2,
  },
  {
    id: "b",
    nameKo: "라마바 쇼룸",
    province: "경기도",
    district: "성남시",
    address: "경기도 성남시 분당구 판교로 2",
    addressDetail: "  2층  ",
    phone: "031-222-2222",
    latitude: 37.39,
    longitude: 127.11,
    type: "showroom",
    sortOrder: 1,
  },
  {
    id: "c",
    nameKo: "다나가 상사",
    province: "서울특별시",
    district: "종로구",
    address: "서울특별시 종로구 종로 3",
    phone: "02-333-3333",
    latitude: 37.57,
    longitude: 126.98,
    type: "dealer",
    sortOrder: 2,
    isActive: false,
  },
  {
    id: "d",
    nameKo: "가가 상사",
    province: "서울특별시",
    district: "강남구",
    address: "서울특별시 강남구 선릉로 4",
    phone: "02-444-4444",
    latitude: 37.51,
    longitude: 127.04,
    type: "dealer",
    sortOrder: 2,
  },
];

test("public dealer visualization fixture is explicitly labeled", () => {
  const example = dealers.find(
    (dealer) => dealer.id === "seoul-station-display-example",
  );

  assert.ok(example);
  assert.equal(example.isExample, true);
  assert.equal(example.phone, undefined);
  assert.equal(example.address, "서울특별시 용산구 한강대로 405");
});

test("returns all active dealers with no filters and excludes inactive dealers", () =>
  assert.deepEqual(
    filterDealers(fixtures).map(({ id }) => id),
    ["b", "d", "a"],
  ));
test("filters by province and district", () => {
  assert.deepEqual(
    filterDealers(fixtures, {
      ...EMPTY_DEALER_FILTERS,
      province: "경기도",
    }).map(({ id }) => id),
    ["b"],
  );
  assert.deepEqual(
    filterDealers(fixtures, {
      ...EMPTY_DEALER_FILTERS,
      province: "서울특별시",
      district: "강남구",
    }).map(({ id }) => id),
    ["d", "a"],
  );
  assert.deepEqual(getDistrictOptions(fixtures, "서울특별시"), ["강남구"]);
});
test("changing province resets district", () =>
  assert.deepEqual(
    changeDealerProvince(
      { province: "서울특별시", district: "강남구", query: "상사" },
      "경기도",
    ),
    { province: "경기도", district: "", query: "상사" },
  ));
test("searches Korean name, English name, and address", () => {
  assert.deepEqual(
    filterDealers(fixtures, { ...EMPTY_DEALER_FILTERS, query: "라마바" }).map(
      ({ id }) => id,
    ),
    ["b"],
  );
  assert.deepEqual(
    filterDealers(fixtures, { ...EMPTY_DEALER_FILTERS, query: "alpha" }).map(
      ({ id }) => id,
    ),
    ["a"],
  );
  assert.deepEqual(
    filterDealers(fixtures, { ...EMPTY_DEALER_FILTERS, query: "판교로" }).map(
      ({ id }) => id,
    ),
    ["b"],
  );
});
test("normalizes English case and repeated surrounding whitespace", () => {
  assert.deepEqual(
    filterDealers(fixtures, {
      ...EMPTY_DEALER_FILTERS,
      query: "  ALPHA   DEALER  ",
    }).map(({ id }) => id),
    ["a"],
  );
  assert.deepEqual(
    filterDealers(fixtures, {
      ...EMPTY_DEALER_FILTERS,
      query: "판교로  2  2층",
    }).map(({ id }) => id),
    ["b"],
  );
});
test("reset returns empty filters and unmatched queries return no results", () => {
  assert.deepEqual(resetDealerFilters(), EMPTY_DEALER_FILTERS);
  assert.deepEqual(
    filterDealers(fixtures, { ...EMPTY_DEALER_FILTERS, query: "없음" }),
    [],
  );
});
test("paginates deterministically", () => {
  const many = Array.from({ length: 13 }, (_, index) => ({
    ...fixtures[0],
    id: String(index),
    nameKo: String(index).padStart(2, "0"),
    sortOrder: index,
  }));
  const secondPage = paginateDealers(filterDealers(many), 2);
  assert.equal(secondPage.pageCount, 2);
  assert.equal(secondPage.items.length, 1);
  assert.equal(secondPage.items[0]?.id, "12");
});
test("sorts by sortOrder then Korean name", () =>
  assert.deepEqual(
    filterDealers(fixtures).map(({ id }) => id),
    ["b", "d", "a"],
  ));
test("missing optional map links do not cause errors", () =>
  assert.doesNotThrow(() =>
    filterDealers([
      { ...fixtures[0], naverMapUrl: undefined, kakaoMapUrl: undefined },
    ]),
  ));
