const NAVER_MAP_SCRIPT_ID = "naver-maps-dynamic-sdk";
let sdkPromise: Promise<NaverMapsNamespace> | undefined;

export type NaverMapListener = object;

export type NaverLatLng = {
  lat(): number;
  lng(): number;
};

export type NaverMap = {
  fitBounds(
    bounds: NaverLatLngBounds,
    margin?:
      number | { top: number; right: number; bottom: number; left: number },
  ): void;
  panTo(position: NaverLatLng): void;
  setCenter(position: NaverLatLng): void;
  setZoom(zoom: number): void;
};

export type NaverMarker = {
  getPosition(): NaverLatLng;
  setMap(map: NaverMap | null): void;
};

export type NaverInfoWindow = {
  close(): void;
  open(map: NaverMap, marker: NaverMarker): void;
};

export type NaverLatLngBounds = {
  extend(position: NaverLatLng): NaverLatLngBounds;
};

export type NaverMapsNamespace = {
  Map: new (
    element: HTMLElement,
    options: {
      center: NaverLatLng;
      zoom: number;
      minZoom?: number;
      maxZoom?: number;
      zoomControl?: boolean;
    },
  ) => NaverMap;
  LatLng: new (latitude: number, longitude: number) => NaverLatLng;
  LatLngBounds: new () => NaverLatLngBounds;
  Marker: new (options: {
    map: NaverMap;
    position: NaverLatLng;
    title?: string;
  }) => NaverMarker;
  InfoWindow: new (options: {
    content: HTMLElement;
    borderWidth?: number;
    disableAnchor?: boolean;
    pixelOffset?: { x: number; y: number };
  }) => NaverInfoWindow;
  Point: new (x: number, y: number) => { x: number; y: number };
  Event: {
    addListener(
      target: NaverMap | NaverMarker,
      eventName: string,
      handler: () => void,
    ): NaverMapListener;
    removeListener(listener: NaverMapListener): void;
  };
};

declare global {
  interface Window {
    naver?: { maps?: NaverMapsNamespace };
    navermap_authFailure?: () => void;
  }
}

export function loadNaverMapSdk(clientId: string) {
  const normalizedClientId = clientId.trim();
  if (!normalizedClientId) {
    return Promise.reject(new Error("NAVER_MAP_CLIENT_ID_MISSING"));
  }
  if (window.naver?.maps) return Promise.resolve(window.naver.maps);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<NaverMapsNamespace>((resolve, reject) => {
    const previousAuthFailure = window.navermap_authFailure;
    const rejectLoad = () => {
      sdkPromise = undefined;
      reject(new Error("NAVER_MAP_SDK_UNAVAILABLE"));
    };
    window.navermap_authFailure = () => {
      previousAuthFailure?.();
      rejectLoad();
    };

    const finishLoad = () => {
      const maps = window.naver?.maps;
      if (!maps) {
        rejectLoad();
        return;
      }
      resolve(maps);
    };

    const existing = document.getElementById(
      NAVER_MAP_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", finishLoad, { once: true });
      existing.addEventListener("error", rejectLoad, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.id = NAVER_MAP_SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(normalizedClientId)}`;
    script.addEventListener("load", finishLoad, { once: true });
    script.addEventListener("error", rejectLoad, { once: true });
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export function getNaverMapAvailability(clientId: string) {
  return clientId.trim() ? "loading" : "unavailable";
}
