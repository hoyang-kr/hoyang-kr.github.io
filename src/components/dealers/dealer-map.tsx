"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Dealer } from "@/data/dealers";
import {
  getDealerMapPoints,
  getDealerMapViewport,
  type DealerMapPoint,
} from "@/lib/dealer-map";
import { normalizeTelephone } from "@/lib/dealer-search";
import {
  getNaverMapAvailability,
  loadNaverMapSdk,
  type NaverInfoWindow,
  type NaverMap,
  type NaverMapListener,
  type NaverMapsNamespace,
  type NaverMarker,
} from "@/lib/naver-map-loader";

const KOREA_CENTER = { latitude: 36.35, longitude: 127.8 };

type MapStatus = "loading" | "ready" | "unavailable" | "error";

export function DealerMap({
  dealers,
  selectedDealerId,
  onSelectDealer,
}: {
  dealers: readonly Dealer[];
  selectedDealerId?: string;
  onSelectDealer: (dealerId: string) => void;
}) {
  const clientId = process.env.PUBLIC_NAVER_MAP_CLIENT_ID ?? "";
  const containerRef = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<NaverMapsNamespace>(undefined);
  const mapRef = useRef<NaverMap>(undefined);
  const markersRef = useRef(new Map<string, NaverMarker>());
  const windowsRef = useRef(new Map<string, NaverInfoWindow>());
  const markerListenersRef = useRef<NaverMapListener[]>([]);
  const mapListenerRef = useRef<NaverMapListener>(undefined);
  const [status, setStatus] = useState<MapStatus>(() =>
    getNaverMapAvailability(clientId),
  );
  const points = useMemo(() => getDealerMapPoints(dealers), [dealers]);
  const dealersById = useMemo(
    () => new Map(dealers.map((dealer) => [dealer.id, dealer])),
    [dealers],
  );

  const closeInfoWindows = useCallback(() => {
    windowsRef.current.forEach((infoWindow) => infoWindow.close());
  }, []);

  const selectOnMap = useCallback(
    (dealerId: string) => {
      const map = mapRef.current;
      const marker = markersRef.current.get(dealerId);
      const infoWindow = windowsRef.current.get(dealerId);
      if (!map || !marker || !infoWindow) return;
      closeInfoWindows();
      map.panTo(marker.getPosition());
      map.setZoom(15);
      infoWindow.open(map, marker);
    },
    [closeInfoWindows],
  );

  useEffect(() => {
    if (!clientId.trim() || !containerRef.current) {
      setStatus("unavailable");
      return;
    }
    let cancelled = false;
    loadNaverMapSdk(clientId)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(
            KOREA_CENTER.latitude,
            KOREA_CENTER.longitude,
          ),
          zoom: 7,
          minZoom: 6,
          maxZoom: 19,
          zoomControl: true,
        });
        mapRef.current = map;
        mapListenerRef.current = maps.Event.addListener(map, "click", () => {
          closeInfoWindows();
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, closeInfoWindows]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (status !== "ready" || !maps || !map) return;

    markerListenersRef.current.forEach((listener) =>
      maps.Event.removeListener(listener),
    );
    markerListenersRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    closeInfoWindows();
    windowsRef.current.clear();

    points.forEach((point) => {
      const dealer = dealersById.get(point.id);
      if (!dealer) return;
      const marker = new maps.Marker({
        map,
        position: new maps.LatLng(point.latitude, point.longitude),
        title: dealer.nameKo,
      });
      const infoWindow = new maps.InfoWindow({
        borderWidth: 0,
        content: createDealerInfoContent(dealer),
        pixelOffset: new maps.Point(0, -10),
      });
      markersRef.current.set(point.id, marker);
      windowsRef.current.set(point.id, infoWindow);
      markerListenersRef.current.push(
        maps.Event.addListener(marker, "click", () => {
          selectOnMap(point.id);
          onSelectDealer(point.id);
        }),
      );
    });

    applyViewport(maps, map, points);
  }, [
    closeInfoWindows,
    dealersById,
    onSelectDealer,
    points,
    selectOnMap,
    status,
  ]);

  useEffect(() => {
    if (status === "ready" && selectedDealerId) selectOnMap(selectedDealerId);
  }, [selectedDealerId, selectOnMap, status]);

  useEffect(
    () => () => {
      const maps = mapsRef.current;
      if (!maps) return;
      markerListenersRef.current.forEach((listener) =>
        maps.Event.removeListener(listener),
      );
      if (mapListenerRef.current)
        maps.Event.removeListener(mapListenerRef.current);
      markersRef.current.forEach((marker) => marker.setMap(null));
      closeInfoWindows();
    },
    [closeInfoWindows],
  );

  return (
    <div
      aria-label="HOYANG 공식 대리점 지도"
      className="relative h-[360px] overflow-hidden border border-line bg-stone lg:h-[680px]"
      role="region"
    >
      <div className="size-full" ref={containerRef} />
      {status !== "ready" ? (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm leading-6 text-muted">
          {status === "loading"
            ? "대리점 지도를 불러오는 중입니다."
            : "현재 지도를 이용할 수 없습니다. 대리점 목록과 지도 링크를 이용해 주세요."}
        </div>
      ) : null}
    </div>
  );
}

function applyViewport(
  maps: NaverMapsNamespace,
  map: NaverMap,
  points: readonly DealerMapPoint[],
) {
  const viewport = getDealerMapViewport(points);
  if (viewport.kind === "empty") return;
  if (viewport.kind === "single") {
    map.setCenter(
      new maps.LatLng(viewport.point.latitude, viewport.point.longitude),
    );
    map.setZoom(viewport.zoom);
    return;
  }
  const bounds = new maps.LatLngBounds();
  viewport.points.forEach((point) =>
    bounds.extend(new maps.LatLng(point.latitude, point.longitude)),
  );
  map.fitBounds(bounds, { top: 64, right: 64, bottom: 64, left: 64 });
}

function createDealerInfoContent(dealer: Dealer) {
  const container = document.createElement("div");
  container.className = "min-w-56 max-w-72 bg-white p-4 text-sm text-ink";

  const name = document.createElement("strong");
  name.className = "block text-base font-medium";
  name.textContent = dealer.nameKo;
  name.dataset.noTranslate = "";
  container.appendChild(name);

  if (dealer.isExample) {
    const exampleNotice = document.createElement("span");
    exampleNotice.className = "mt-1 block text-xs font-semibold text-brand";
    exampleNotice.textContent = "화면 구성 예시 · 공식 대리점 아님";
    container.appendChild(exampleNotice);
  }

  if (dealer.nameEn) {
    const englishName = document.createElement("span");
    englishName.className =
      "mt-1 block text-[10px] tracking-wider text-muted uppercase";
    englishName.textContent = dealer.nameEn;
    englishName.dataset.noTranslate = "";
    container.appendChild(englishName);
  }

  const address = document.createElement("p");
  address.className = "mt-3 leading-5 text-muted";
  address.dataset.noTranslate = "";
  address.textContent = [dealer.address, dealer.addressDetail]
    .filter(Boolean)
    .join(" ");
  container.appendChild(address);

  if (dealer.phone) {
    const phone = document.createElement("p");
    phone.className = "mt-2";
    phone.textContent = dealer.phone;
    phone.dataset.noTranslate = "";
    container.appendChild(phone);
  }

  const actions = document.createElement("div");
  actions.className =
    "mt-3 flex flex-wrap gap-3 border-t border-line pt-3 text-xs font-semibold";
  if (dealer.phone)
    actions.appendChild(
      createLink("전화하기", `tel:${normalizeTelephone(dealer.phone)}`),
    );
  if (dealer.naverMapUrl)
    actions.appendChild(
      createLink("네이버 지도에서 보기", dealer.naverMapUrl, true),
    );
  if (actions.childElementCount > 0) container.appendChild(actions);
  return container;
}

function createLink(label: string, href: string, external = false) {
  const link = document.createElement("a");
  link.textContent = label;
  link.href = href;
  if (external) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  return link;
}
