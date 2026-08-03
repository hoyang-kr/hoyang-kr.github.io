"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SearchIcon } from "@/components/icons";
import {
  buildSearchOptions,
  SearchResults,
} from "@/components/search/search-results";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { finishes, products } from "@/data/products";
import { normalizeSearchText, searchCatalog } from "@/lib/catalog-search";

const recommendedQueries = ["HG822C", "수건걸이", "매립형 휴지걸이", "크롬"];

export function GlobalSearch({
  autoFocus = false,
  className = "",
  onClose,
  onNavigate,
  placeholder = "제품명 또는 모델 번호를 검색하세요",
}: {
  autoFocus?: boolean;
  className?: string;
  onClose?: () => void;
  onNavigate?: () => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const instanceId = useId().replaceAll(":", "");
  const resultsId = "search-results-" + instanceId;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = normalizeSearchText(query);
  const results = useMemo(
    () => searchCatalog(query, products, categories, collections, finishes),
    [query],
  );
  const hasSuggestions =
    results.products.length > 0 ||
    results.categories.length > 0 ||
    results.collections.length > 0;
  const options = useMemo(
    () =>
      normalizedQuery && hasSuggestions
        ? buildSearchOptions(query, results)
        : [],
    [hasSuggestions, normalizedQuery, query, results],
  );

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const navigate = (href: string) => {
    onNavigate?.();
    router.push(href);
  };
  const submit = () => {
    if (!normalizedQuery) return;
    navigate("/products?q=" + encodeURIComponent(query.trim()));
  };

  return (
    <search className={className}>
      <form
        aria-label="제품 검색"
        className="flex min-h-12 items-center border border-line bg-white focus-within:border-brand"
        onSubmit={(event) => {
          event.preventDefault();
          if (activeIndex >= 0 && options[activeIndex])
            navigate(options[activeIndex].href);
          else submit();
        }}
        role="search"
      >
        <SearchIcon className="mx-4 size-5 shrink-0 text-muted" />
        <label className="sr-only" htmlFor={"product-search-" + instanceId}>
          제품 검색
        </label>
        <input
          aria-activedescendant={
            activeIndex >= 0
              ? "search-option-" + instanceId + "-" + activeIndex
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={normalizedQuery ? resultsId : undefined}
          aria-expanded={Boolean(normalizedQuery)}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 bg-transparent pr-3 text-base outline-none placeholder:text-muted md:text-sm"
          id={"product-search-" + instanceId}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && onClose) {
              event.preventDefault();
              onClose();
              return;
            }
            if (!normalizedQuery || options.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => (current + 1) % options.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) =>
                current <= 0 ? options.length - 1 : current - 1,
              );
            }
          }}
          placeholder={placeholder}
          ref={inputRef}
          role="combobox"
          type="search"
          value={query}
        />
        <button
          className="min-h-11 border-l border-line px-4 text-sm font-semibold hover:text-brand"
          type="submit"
        >
          검색
        </button>
      </form>

      {normalizedQuery ? (
        <div id={resultsId} role="listbox">
          <SearchResults
            activeIndex={activeIndex}
            instanceId={instanceId}
            onActiveIndexChange={setActiveIndex}
            onSelect={onNavigate}
            query={query}
            results={results}
          />
        </div>
      ) : (
        <div className="border-t border-line py-5">
          <p className="text-xs font-bold tracking-[0.12em] text-brand">
            추천 검색어
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recommendedQueries.map((recommended) => (
              <Link
                className="border border-line px-3 py-2 text-sm hover:border-brand hover:text-brand"
                href={"/products?q=" + encodeURIComponent(recommended)}
                key={recommended}
                onClick={onNavigate}
              >
                {recommended}
              </Link>
            ))}
          </div>
        </div>
      )}
    </search>
  );
}
