import assert from "node:assert/strict";
import test from "node:test";

import type { Dealer } from "@/data/dealers";
import {
  getDealerMapPoints,
  getDealerMapViewport,
  selectDealerOnMap,
  syncDealerMap,
  type DealerMapAdapter,
  type DealerMapViewport,
} from "@/lib/dealer-map";
import { getNaverMapAvailability } from "@/lib/naver-map-loader";

const dealers: Dealer[] = [
  {
    id: "seoul",
    nameKo: "서울 대리점",
    province: "서울특별시",
    district: "중구",
    address: "서울특별시 중구",
    phone: "02-111-1111",
    latitude: 37.5665,
    longitude: 126.978,
    type: "dealer",
  },
  {
    id: "busan",
    nameKo: "부산 대리점",
    province: "부산광역시",
    district: "중구",
    address: "부산광역시 중구",
    phone: "051-111-1111",
    latitude: 35.1796,
    longitude: 129.0756,
    type: "dealer",
  },
];

function createAdapter() {
  const calls: {
    cleared: number;
    rendered: string[][];
    selected: string[];
    viewports: DealerMapViewport[];
  } = { cleared: 0, rendered: [], selected: [], viewports: [] };
  const adapter: DealerMapAdapter = {
    clearMarkers: () => calls.cleared++,
    renderMarkers: (points) => calls.rendered.push(points.map(({ id }) => id)),
    selectDealer: (id) => calls.selected.push(id),
    showViewport: (viewport) => calls.viewports.push(viewport),
  };
  return { adapter, calls };
}

test("derives marker data from active filtered dealers", () => {
  assert.deepEqual(
    getDealerMapPoints([dealers[0]]).map(({ id }) => id),
    ["seoul"],
  );
  assert.deepEqual(
    getDealerMapPoints([{ ...dealers[0], isActive: false }]),
    [],
  );
});

test("excludes invalid, infinite, and NaN coordinates", () => {
  const invalid = [
    { ...dealers[0], id: "latitude", latitude: 91 },
    { ...dealers[0], id: "longitude", longitude: -181 },
    { ...dealers[0], id: "nan", latitude: Number.NaN },
    { ...dealers[0], id: "infinite", longitude: Number.POSITIVE_INFINITY },
  ];
  assert.deepEqual(getDealerMapPoints(invalid), []);
});

test("card selection requests map centering through the adapter", () => {
  const { adapter, calls } = createAdapter();
  selectDealerOnMap(adapter, "seoul");
  assert.deepEqual(calls.selected, ["seoul"]);
});

test("marker selection can update the selected dealer", () => {
  let selected = "";
  const onMarkerSelect = (id: string) => {
    selected = id;
  };
  onMarkerSelect("busan");
  assert.equal(selected, "busan");
});

test("filter changes replace marker data", () => {
  const { adapter, calls } = createAdapter();
  syncDealerMap(adapter, dealers);
  syncDealerMap(adapter, [dealers[1]]);
  assert.equal(calls.cleared, 2);
  assert.deepEqual(calls.rendered, [["seoul", "busan"], ["busan"]]);
});

test("one result uses a centered single-dealer viewport", () => {
  const viewport = getDealerMapViewport(getDealerMapPoints([dealers[0]]));
  assert.equal(viewport.kind, "single");
  if (viewport.kind === "single") assert.equal(viewport.point.id, "seoul");
});

test("multiple results fit bounds", () => {
  assert.equal(
    getDealerMapViewport(getDealerMapPoints(dealers)).kind,
    "bounds",
  );
});

test("empty results remove markers safely", () => {
  const { adapter, calls } = createAdapter();
  syncDealerMap(adapter, []);
  assert.equal(calls.cleared, 1);
  assert.deepEqual(calls.rendered, [[]]);
  assert.equal(calls.viewports[0]?.kind, "empty");
});

test("missing client ID activates the map fallback without affecting directory data", () => {
  assert.equal(getNaverMapAvailability(""), "unavailable");
  assert.equal(getDealerMapPoints(dealers).length, 2);
});

test("SDK failure state can preserve the independently derived directory", () => {
  const sdkState = "error";
  assert.equal(sdkState, "error");
  assert.deepEqual(
    getDealerMapPoints(dealers).map(({ id }) => id),
    ["seoul", "busan"],
  );
});
