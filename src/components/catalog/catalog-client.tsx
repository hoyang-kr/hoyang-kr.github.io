"use client";

import {
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ProductFilters,
  type CatalogFilterValues,
} from "@/components/catalog/product-filters";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CloseIcon, FilterIcon, SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { productBelongsToCollection } from "@/lib/catalog";
import { searchCatalog } from "@/lib/catalog-search";
import { sortProductsFeaturedFirst } from "@/lib/product-sort";
import type { Category, Collection, Finish, Product } from "@/types/product";

type CatalogClientProps = {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  finishes: Finish[];
};

type SortKey = "catalog" | "featured" | "name" | "model";
// Avoid a route update between adjacent Korean IME composition sequences.
const SEARCH_COMMIT_DELAY_MS = 200;

export function CatalogClient({
  products,
  categories,
  collections,
  finishes,
}: CatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchComposingRef = useRef(false);
  const searchUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const urlValues = useMemo<CatalogFilterValues>(
    () => ({
      category: searchParams.get("category") ?? "",
      collection: searchParams.get("collection") ?? "",
      finish: searchParams.get("finish") ?? "",
    }),
    [searchParams],
  );
  const [values, setOptimisticValues] = useOptimistic(urlValues);
  const [, startFilterTransition] = useTransition();
  const sort = (searchParams.get("sort") as SortKey | null) ?? "featured";
  const query = searchParams.get("q") ?? "";
  const activeFilterCount = Object.values(values).filter(Boolean).length;

  useEffect(() => {
    const input = searchInputRef.current;
    if (
      input &&
      !isSearchComposingRef.current &&
      searchUpdateTimerRef.current === null &&
      input.value !== query
    ) {
      input.value = query;
    }
  }, [query]);

  useEffect(
    () => () => {
      if (searchUpdateTimerRef.current !== null) {
        clearTimeout(searchUpdateTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!mobileOpen) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        filterTriggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    startFilterTransition(() => {
      if (key === "category" || key === "collection" || key === "finish") {
        setOptimisticValues((current) => ({ ...current, [key]: value }));
      }
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  const cancelScheduledSearchUpdate = () => {
    if (searchUpdateTimerRef.current === null) return;
    clearTimeout(searchUpdateTimerRef.current);
    searchUpdateTimerRef.current = null;
  };
  const commitSearchQuery = (value: string) => {
    cancelScheduledSearchUpdate();
    updateParam("q", value);
  };
  const scheduleSearchQuery = (value: string) => {
    cancelScheduledSearchUpdate();
    searchUpdateTimerRef.current = setTimeout(() => {
      searchUpdateTimerRef.current = null;
      if (!isSearchComposingRef.current) updateParam("q", value);
    }, SEARCH_COMMIT_DELAY_MS);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("collection");
    params.delete("finish");
    params.delete("q");
    const query = params.toString();
    startFilterTransition(() => {
      setOptimisticValues({ category: "", collection: "", finish: "" });
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  const searchResults = useMemo(
    () => searchCatalog(query, products, categories, collections, finishes),
    [categories, collections, finishes, products, query],
  );
  const filteredProducts = useMemo(() => {
    const searchedProducts = query
      ? searchResults.products.map(({ product }) => product)
      : products;
    const filtered = searchedProducts.filter((product) => {
      const categoryMatch =
        !values.category || product.category === values.category;
      const collectionMatch =
        !values.collection ||
        productBelongsToCollection(product, values.collection);
      const finishMatch =
        !values.finish ||
        product.variants.some((variant) => variant.finish === values.finish);
      return categoryMatch && collectionMatch && finishMatch;
    });

    if (sort === "featured") {
      return sortProductsFeaturedFirst(filtered);
    }

    if (sort === "catalog") {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      if (sort === "name") {
        return a.nameKo.localeCompare(b.nameKo, "ko");
      }

      const aModel = a.variants[0].modelNumber || a.nameKo;
      const bModel = b.variants[0].modelNumber || b.nameKo;

      return aModel.localeCompare(bModel, "ko", {
        numeric: true,
      });
    });
  }, [
    products,
    query,
    searchResults.products,
    sort,
    values.category,
    values.collection,
    values.finish,
  ]);
  const preferredFinish =
    finishes.find((finish) => finish === values.finish) ??
    searchResults.preferredFinish;

  return (
    <div className="page-shell pb-24">
      <form
        aria-label="제품 검색"
        className="mb-7 flex min-h-12 items-center border border-line bg-white focus-within:border-brand"
        onSubmit={(event) => {
          event.preventDefault();
          if (isSearchComposingRef.current) return;
          commitSearchQuery(searchInputRef.current?.value ?? "");
        }}
        role="search"
      >
        <SearchIcon className="mx-4 size-5 shrink-0 text-muted" />
        <label className="sr-only" htmlFor="catalog-product-search">
          제품명 또는 모델 번호 검색
        </label>
        <input
          autoComplete="off"
          className="h-12 min-w-0 flex-1 bg-transparent pr-3 text-base outline-none placeholder:text-muted md:text-sm"
          defaultValue={query}
          id="catalog-product-search"
          onChange={(event) => {
            const nativeEvent = event.nativeEvent as InputEvent;
            if (isSearchComposingRef.current || nativeEvent.isComposing) return;
            scheduleSearchQuery(event.currentTarget.value);
          }}
          onCompositionEnd={(event) => {
            isSearchComposingRef.current = false;
            scheduleSearchQuery(event.currentTarget.value);
          }}
          onCompositionStart={() => {
            isSearchComposingRef.current = true;
            cancelScheduledSearchUpdate();
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (isSearchComposingRef.current || event.nativeEvent.isComposing)
            ) {
              event.preventDefault();
            }
          }}
          placeholder="제품명 또는 모델 번호 검색"
          ref={searchInputRef}
          type="search"
        />
        {query ? (
          <button
            aria-label="검색어 지우기"
            className="flex size-11 items-center justify-center border-l border-line hover:text-brand"
            onClick={() => {
              cancelScheduledSearchUpdate();
              if (searchInputRef.current) searchInputRef.current.value = "";
              updateParam("q", "");
            }}
            type="button"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : null}
      </form>

      <div className="mb-7 flex items-center justify-between border-y border-line py-4 lg:justify-end">
        <button
          className="flex items-center gap-2 text-sm font-medium lg:hidden"
          onClick={() => setMobileOpen(true)}
          ref={filterTriggerRef}
          type="button"
        >
          <FilterIcon className="size-4" />
          필터
          {activeFilterCount > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[10px] text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <label className="flex items-center gap-3 text-xs text-muted">
          정렬
          <select
            aria-label="제품 정렬"
            className="min-w-32 border border-line bg-warm-white px-3 py-2 text-xs text-ink"
            onChange={(event) => updateParam("sort", event.target.value)}
            value={sort}
          >
            <option value="catalog">기본순</option>
            <option value="featured">추천순</option>
            <option value="name">제품명순</option>
            <option value="model">모델명순</option>
          </select>
        </label>
      </div>

      <div className="grid gap-12 lg:grid-cols-[15rem_1fr]">
        <aside aria-label="제품 필터" className="hidden lg:block">
          <div className="sticky top-28">
            <ProductFilters
              categories={categories}
              collections={collections}
              finishes={finishes}
              onChange={updateParam}
              onClear={clearFilters}
              values={values}
            />
          </div>
        </aside>

        <div>
          <div
            aria-live="polite"
            className="mb-6 flex items-center justify-between text-xs text-muted"
          >
            <p>총 {filteredProducts.length}개 제품</p>
            {activeFilterCount > 0 ? (
              <button
                className="border-b border-brand"
                onClick={clearFilters}
                type="button"
              >
                필터 초기화
              </button>
            ) : null}
          </div>
          {filteredProducts.length > 0 ? (
            <ProductGrid
              className="lg:grid-cols-3"
              preferredFinish={preferredFinish}
              products={filteredProducts}
            />
          ) : query ? (
            <div className="border-y border-line py-14">
              <p className="text-lg font-semibold">검색 결과가 없습니다.</p>
              <p className="mt-2 text-sm text-muted">
                제품명이나 모델 번호를 다시 확인해 주세요.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="button-secondary"
                  onClick={() => updateParam("q", "")}
                  type="button"
                >
                  전체 제품 보기
                </button>
                <Link
                  className="button-secondary"
                  href="/contact?topic=product"
                >
                  제품 문의
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {mobileOpen ? (
        <div
          aria-label="제품 필터"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone lg:hidden"
          ref={dialogRef}
          role="dialog"
        >
          <div className="flex h-17 items-center justify-between border-b border-line px-5">
            <p className="font-semibold">제품 필터</p>
            <button
              aria-label="필터 닫기"
              className="flex size-11 items-center justify-center"
              onClick={() => setMobileOpen(false)}
              ref={closeButtonRef}
              type="button"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
          <div className="h-[calc(100dvh-8.75rem)] overflow-y-auto px-5 py-5">
            <ProductFilters
              categories={categories}
              collections={collections}
              finishes={finishes}
              onChange={updateParam}
              onClear={clearFilters}
              values={values}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 border-t border-line bg-white p-4">
            <button
              className="button-primary w-full"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              {filteredProducts.length}개 제품 보기
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}
