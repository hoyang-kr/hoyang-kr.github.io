"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DealerMap } from "@/components/dealers/dealer-map";
import { ExternalIcon, PhoneIcon } from "@/components/icons";
import type { Dealer } from "@/data/dealers";
import {
  changeDealerProvince,
  EMPTY_DEALER_FILTERS,
  filterDealers,
  getDistrictOptions,
  getProvinceOptions,
  normalizeTelephone,
  paginateDealers,
  resetDealerFilters,
  type DealerFilters,
} from "@/lib/dealer-search";

const labels = {
  allProvinces: "전체 시·도",
  allDistricts: "전체 시·군·구",
  placeholder: "대리점명 또는 주소를 입력하세요",
  noResults: "선택한 조건에 맞는 대리점이 없습니다.",
} as const;

export function DealerFinder({ dealers }: { dealers: readonly Dealer[] }) {
  const [filters, setFilters] = useState<DealerFilters>(EMPTY_DEALER_FILTERS);
  const [queryInput, setQueryInput] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDealerId, setSelectedDealerId] = useState<string>();
  const focusSelectedCard = useRef(false);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const provinces = useMemo(() => getProvinceOptions(dealers), [dealers]);
  const districts = useMemo(
    () => getDistrictOptions(dealers, filters.province),
    [dealers, filters.province],
  );
  const results = useMemo(
    () => filterDealers(dealers, filters),
    [dealers, filters],
  );
  const exampleResultCount = results.filter(
    (dealer) => dealer.isExample,
  ).length;
  const pagination = paginateDealers(results, page);
  const featured = useMemo(
    () =>
      filterDealers(dealers).filter(
        (dealer) => dealer.type === "showroom" || dealer.isFeatured,
      ),
    [dealers],
  );

  useEffect(() => {
    if (!selectedDealerId || !focusSelectedCard.current) return;
    const frame = window.requestAnimationFrame(() => {
      const card = cardRefs.current.get(selectedDealerId);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.focus({ preventScroll: true });
      focusSelectedCard.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [page, selectedDealerId]);

  const handleCardSelect = useCallback((dealerId: string) => {
    setSelectedDealerId(dealerId);
  }, []);

  const handleMarkerSelect = useCallback(
    (dealerId: string) => {
      const resultIndex = results.findIndex(({ id }) => id === dealerId);
      if (resultIndex < 0) return;
      focusSelectedCard.current = true;
      setPage(Math.floor(resultIndex / 12) + 1);
      setSelectedDealerId(dealerId);
    },
    [results],
  );
  function applySearch(event: FormEvent) {
    event.preventDefault();
    setFilters((current) => ({ ...current, query: queryInput }));
    setPage(1);
    setSelectedDealerId(undefined);
  }

  return (
    <>
      {featured.length ? (
        <section
          aria-labelledby="featured-showrooms"
          className="mb-16 md:mb-24"
        >
          <p className="eyebrow-section mb-4">Visit HOYANG</p>
          <h2
            className="text-3xl font-medium tracking-[-0.04em] md:text-4xl"
            id="featured-showrooms"
          >
            HOYANG 쇼룸
          </h2>
          <div className="mt-8 grid gap-px border border-line bg-line lg:grid-cols-2">
            {featured.map((dealer) => (
              <DealerCard
                dealer={dealer}
                featured
                key={dealer.id}
                onSelect={handleCardSelect}
                selected={selectedDealerId === dealer.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="dealer-directory">
        <div className="mb-8">
          <p className="eyebrow-section mb-4">Dealer directory</p>
          <h2
            className="text-3xl font-medium tracking-[-0.04em] md:text-4xl"
            id="dealer-directory"
          >
            대리점 찾기
          </h2>
        </div>
        <form
          className="border-y border-line bg-stone p-5 md:p-7"
          onSubmit={applySearch}
          role="search"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(10rem,0.65fr)_minmax(10rem,0.65fr)_minmax(16rem,1.4fr)_auto] lg:items-end">
            <Field label="시·도">
              <select
                className="min-h-12 w-full border border-line bg-white px-3 text-sm"
                onChange={(event) => {
                  setFilters((current) =>
                    changeDealerProvince(current, event.target.value),
                  );
                  setPage(1);
                  setSelectedDealerId(undefined);
                }}
                value={filters.province}
              >
                <option value="">{labels.allProvinces}</option>
                {provinces.map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </Field>
            <Field label="시·군·구">
              <select
                className="min-h-12 w-full border border-line bg-white px-3 text-sm disabled:bg-surface disabled:text-muted"
                disabled={!filters.province}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    district: event.target.value,
                  }));
                  setPage(1);
                  setSelectedDealerId(undefined);
                }}
                value={filters.district}
              >
                <option value="">{labels.allDistricts}</option>
                {districts.map((district) => (
                  <option key={district}>{district}</option>
                ))}
              </select>
            </Field>
            <Field label="대리점 검색">
              <input
                className="min-h-12 w-full min-w-0 border border-line bg-white px-4 text-sm placeholder:text-muted"
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder={labels.placeholder}
                type="search"
                value={queryInput}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2 md:col-span-2 lg:col-span-1">
              <button className="button-primary w-full" type="submit">
                검색
              </button>
              <button
                className="button-secondary w-full"
                onClick={() => {
                  setFilters(resetDealerFilters());
                  setQueryInput("");
                  setPage(1);
                  setSelectedDealerId(undefined);
                }}
                type="button"
              >
                초기화
              </button>
            </div>
          </div>
        </form>
        <p
          aria-live="polite"
          className="mt-8 text-sm font-medium"
          role="status"
        >
          {exampleResultCount === results.length && results.length > 0
            ? `총 ${results.length}개의 예시 위치가 있습니다.`
            : exampleResultCount > 0
              ? `총 ${results.length}개의 위치가 있습니다. (예시 ${exampleResultCount}개 포함)`
              : `총 ${results.length}개의 대리점이 있습니다.`}
        </p>
        <div className="mt-5 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="order-1 lg:sticky lg:top-28 lg:order-2">
            <DealerMap
              dealers={results}
              onSelectDealer={handleMarkerSelect}
              selectedDealerId={selectedDealerId}
            />
          </div>
          <div className="order-2 min-w-0 lg:order-1">
            {pagination.items.length ? (
              <div className="grid gap-px border border-line bg-line">
                {pagination.items.map((dealer) => (
                  <DealerCard
                    cardRef={(node) => {
                      if (node) cardRefs.current.set(dealer.id, node);
                      else cardRefs.current.delete(dealer.id);
                    }}
                    dealer={dealer}
                    key={dealer.id}
                    onSelect={handleCardSelect}
                    selected={selectedDealerId === dealer.id}
                  />
                ))}
              </div>
            ) : (
              <div className="border-y border-line py-16 text-center text-sm text-muted">
                {labels.noResults}
              </div>
            )}
            {pagination.pageCount > 1 ? (
              <nav
                aria-label="대리점 검색 결과 페이지"
                className="mt-10 flex items-center justify-center gap-2"
              >
                <button
                  aria-label="이전 페이지"
                  className="button-secondary min-w-12 px-3 disabled:border-line disabled:text-muted"
                  disabled={pagination.page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  이전
                </button>
                <span aria-current="page" className="px-3 text-sm">
                  {pagination.page} / {pagination.pageCount}
                </span>
                <button
                  aria-label="다음 페이지"
                  className="button-secondary min-w-12 px-3 disabled:border-line disabled:text-muted"
                  disabled={pagination.page === pagination.pageCount}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.pageCount, current + 1),
                    )
                  }
                  type="button"
                >
                  다음
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactElement;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-muted">
      <span>{label}</span>
      {children}
    </label>
  );
}

function DealerCard({
  dealer,
  featured = false,
  selected = false,
  onSelect,
  cardRef,
}: {
  dealer: Dealer;
  featured?: boolean;
  selected?: boolean;
  onSelect?: (dealerId: string) => void;
  cardRef?: (node: HTMLElement | null) => void;
}) {
  const fullAddress = [dealer.address, dealer.addressDetail]
    .filter(Boolean)
    .join(" ");
  return (
    <article
      aria-current={selected ? "location" : undefined}
      className={[
        "flex flex-col bg-white outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-brand",
        featured ? "min-h-80 p-7 md:p-9" : "min-h-72 p-6",
        selected ? "border-l-4 border-brand" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect?.(dealer.id)}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(dealer.id);
        }
      }}
      ref={cardRef}
      tabIndex={onSelect ? 0 : undefined}
    >
      <p className="eyebrow">
        {dealer.isExample
          ? "DISPLAY EXAMPLE"
          : dealer.type === "showroom"
            ? "HOYANG SHOWROOM"
            : "OFFICIAL DEALER"}
      </p>
      {dealer.isExample ? (
        <p className="mt-3 text-xs font-semibold text-brand">
          공식 대리점 정보가 아닌 화면 구성 예시입니다.
        </p>
      ) : null}
      {selected ? (
        <span className="mt-3 text-xs font-semibold">선택됨</span>
      ) : null}
      <div className="mt-6 flex-1">
        <h3
          className={`${featured ? "text-2xl" : "text-xl"} font-medium tracking-[-0.025em]`}
          data-no-translate
        >
          {dealer.nameKo}
        </h3>
        {dealer.nameEn ? (
          <p
            className="mt-2 text-[11px] tracking-[0.13em] text-muted uppercase"
            data-no-translate
          >
            {dealer.nameEn}
          </p>
        ) : null}
        <dl className="mt-6 grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-2 text-sm leading-6">
          <dt className="text-muted">주소</dt>
          <dd className="min-w-0 break-words" data-no-translate>
            {fullAddress}
          </dd>
          {dealer.phone ? (
            <>
              <dt className="text-muted">전화</dt>
              <dd data-no-translate>
                <a
                  className="hover:text-brand"
                  href={`tel:${normalizeTelephone(dealer.phone)}`}
                >
                  {dealer.phone}
                </a>
              </dd>
            </>
          ) : null}
          {dealer.operatingHours ? (
            <>
              <dt className="text-muted">영업시간</dt>
              <dd data-no-translate>{dealer.operatingHours}</dd>
            </>
          ) : null}
        </dl>
      </div>
      {dealer.phone || dealer.naverMapUrl || dealer.kakaoMapUrl ? (
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-5 text-sm font-semibold">
          {dealer.phone ? (
            <a
              className="inline-flex min-h-11 items-center gap-1.5"
              href={`tel:${normalizeTelephone(dealer.phone)}`}
            >
              <PhoneIcon className="size-4" />
              전화하기
            </a>
          ) : null}
          {dealer.naverMapUrl ? (
            <MapLink href={dealer.naverMapUrl} label="네이버 지도" />
          ) : null}
          {dealer.kakaoMapUrl ? (
            <MapLink href={dealer.kakaoMapUrl} label="카카오맵" />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function MapLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex min-h-11 items-center gap-1.5 hover:text-brand"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {label}
      <ExternalIcon className="size-3.5" />
    </a>
  );
}
