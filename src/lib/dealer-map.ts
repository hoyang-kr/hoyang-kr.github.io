import type { Dealer } from "@/data/dealers";

export type DealerMapPoint = {
  id: string;
  latitude: number;
  longitude: number;
};

export type DealerMapViewport =
  | { kind: "empty" }
  | { kind: "single"; point: DealerMapPoint; zoom: number }
  | { kind: "bounds"; points: DealerMapPoint[] };

export type DealerMapAdapter = {
  clearMarkers(): void;
  renderMarkers(points: DealerMapPoint[]): void;
  showViewport(viewport: DealerMapViewport): void;
  selectDealer(id: string): void;
};

export function hasValidDealerCoordinates(dealer: Dealer) {
  return (
    Number.isFinite(dealer.latitude) &&
    Number.isFinite(dealer.longitude) &&
    dealer.latitude >= -90 &&
    dealer.latitude <= 90 &&
    dealer.longitude >= -180 &&
    dealer.longitude <= 180
  );
}

export function getDealerMapPoints(dealers: readonly Dealer[]) {
  return dealers
    .filter(
      (dealer) =>
        dealer.isActive !== false && hasValidDealerCoordinates(dealer),
    )
    .map(({ id, latitude, longitude }) => ({ id, latitude, longitude }));
}

export function getDealerMapViewport(
  points: readonly DealerMapPoint[],
): DealerMapViewport {
  if (points.length === 0) return { kind: "empty" };
  if (points.length === 1)
    return { kind: "single", point: points[0], zoom: 15 };
  return { kind: "bounds", points: [...points] };
}

export function syncDealerMap(
  adapter: DealerMapAdapter,
  dealers: readonly Dealer[],
) {
  const points = getDealerMapPoints(dealers);
  adapter.clearMarkers();
  adapter.renderMarkers(points);
  adapter.showViewport(getDealerMapViewport(points));
  return points;
}

export function selectDealerOnMap(
  adapter: Pick<DealerMapAdapter, "selectDealer">,
  dealerId: string,
) {
  adapter.selectDealer(dealerId);
}
