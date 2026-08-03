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
// A Korean IME can end one syllable and start the next in the same key sequence.
// Keep React updates out of that handoff so the browser remains the text owner.
const SEARCH_COMMIT_DELAY_MS = 200;

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
  const isComposingRef = useRef(false);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instanceId = useId().replaceAll(":", "");
  const resultsId = "search-results-" + instanceId;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const commitQuery = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
  };
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

  useEffect(
    () => () => {
      if (commitTimerRef.current !== null) {
        clearTimeout(commitTimerRef.current);
      }
    },
    [],
  );

  const cancelScheduledCommit = () => {
    if (commitTimerRef.current === null) return;
    clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
  };
  const scheduleQueryCommit = (value: string) => {
    cancelScheduledCommit();
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      if (!isComposingRef.current) commitQuery(value);
    }, SEARCH_COMMIT_DELAY_MS);
  };

  const navigate = (href: string) => {
    onNavigate?.();
    router.push(href);
  };
  const submit = () => {
    const submittedQuery = inputRef.current?.value.trim() ?? "";

    if (!normalizeSearchText(submittedQuery)) return;

    cancelScheduledCommit();
    if (submittedQuery !== query.trim()) {
      commitQuery(inputRef.current?.value ?? "");
    }

    navigate("/products?q=" + encodeURIComponent(submittedQuery));
  };

  return (
    <search className={className}>
      <form
        aria-label="제품 검색"
        className="flex min-h-12 items-center border border-line bg-white focus-within:border-brand"
        onSubmit={(event) => {
          event.preventDefault();
          if (isComposingRef.current) return;
          const hasUncommittedInput = (inputRef.current?.value ?? "") !== query;
          if (!hasUncommittedInput && activeIndex >= 0 && options[activeIndex])
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
            const nativeEvent = event.nativeEvent as InputEvent;

            if (isComposingRef.current || nativeEvent.isComposing) return;

            scheduleQueryCommit(event.currentTarget.value);
          }}
          onCompositionEnd={(event) => {
            isComposingRef.current = false;
            scheduleQueryCommit(event.currentTarget.value);
          }}
          onCompositionStart={() => {
            isComposingRef.current = true;
            cancelScheduledCommit();
          }}
          onKeyDown={(event) => {
            const isComposing =
              event.nativeEvent.isComposing || isComposingRef.current;

            if (isComposing) {
              if (event.key === "Enter") {
                event.preventDefault();
              }

              return;
            }

            if (event.key === "Escape" && onClose) {
              event.preventDefault();
              onClose();
              return;
            }
            if (commitTimerRef.current !== null) return;
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
          defaultValue=""
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
