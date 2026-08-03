"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

import {
  ChevronDownIcon,
  CloseIcon,
  ExternalIcon,
  MenuIcon,
} from "@/components/icons";
import { siteConfig } from "@/config/site";
import { LanguageSelector } from "@/components/layout/language-selector";
import { GlobalSearch } from "@/components/search/global-search";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { finishes } from "@/data/products";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    document.body.style.overflow = isOpen ? "hidden" : "";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerButtonRef.current?.focus();
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
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  return (
    <div className="lg:hidden">
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-label="메뉴 열기"
        className="flex size-11 items-center justify-center"
        onClick={() => setIsOpen(true)}
        ref={triggerButtonRef}
        type="button"
      >
        <MenuIcon className="size-6" />
      </button>

      {isOpen ? (
        <div
          aria-label="모바일 메뉴"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone"
          id={menuId}
          ref={dialogRef}
          role="dialog"
        >
          <div className="flex h-17 items-center justify-between border-b border-line px-5">
            <Link
              className="text-lg font-semibold tracking-[-0.03em]"
              href="/"
              onClick={close}
            >
              {siteConfig.brandNameKo}
            </Link>
            <button
              aria-label="메뉴 닫기"
              className="flex size-11 items-center justify-center"
              onClick={close}
              ref={closeButtonRef}
              type="button"
            >
              <CloseIcon className="size-6" />
            </button>
          </div>

          <nav
            aria-label="모바일 주 메뉴"
            className="h-[calc(100dvh-4.25rem)] overflow-y-auto px-5 pb-12"
          >
            <div className="py-4">
              <GlobalSearch
                onClose={close}
                onNavigate={close}
                placeholder="제품명 또는 모델 번호 검색"
              />
            </div>

            <LanguageSelector mobile />

            <details className="mobile-accordion">
              <summary>
                제품
                <ChevronDownIcon className="size-4" />
              </summary>
              <div className="pb-4">
                <Link href="/products" onClick={close}>
                  전체 제품
                </Link>
                {categories.map((category) => (
                  <Link
                    href={`/products?category=${category.id}`}
                    key={category.id}
                    onClick={close}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </details>

            <details className="mobile-accordion">
              <summary>
                컬렉션
                <ChevronDownIcon className="size-4" />
              </summary>
              <div className="pb-4">
                <Link href="/collections" onClick={close}>
                  전체 컬렉션
                </Link>
                {collections.map((collection) => (
                  <Link
                    href={`/collections/${collection.slug}`}
                    key={collection.id}
                    onClick={close}
                  >
                    {collection.nameKo}
                  </Link>
                ))}
              </div>
            </details>

            <details className="mobile-accordion">
              <summary>
                마감
                <ChevronDownIcon className="size-4" />
              </summary>
              <div className="pb-4">
                {finishes.map((finish) => (
                  <Link
                    href={`/products?finish=${finish}`}
                    key={finish}
                    onClick={close}
                  >
                    <span className={`finish-swatch finish-${finish}`} />
                    {finish}
                  </Link>
                ))}
              </div>
            </details>

            <Link className="mobile-main-link" href="/about" onClick={close}>
              브랜드
            </Link>
            <Link className="mobile-main-link" href="/dealers" onClick={close}>
              대리점
            </Link>
            <Link className="mobile-main-link" href="/support" onClick={close}>
              고객지원
            </Link>
            <Link className="mobile-main-link" href="/contact" onClick={close}>
              문의
            </Link>

            {siteConfig.naverSmartStoreUrl ? (
              <a
                className="mt-8 flex min-h-12 items-center justify-center gap-2 border border-line px-5 py-3 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
                href={siteConfig.naverSmartStoreUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                네이버 스토어
                <ExternalIcon className="size-4" />
              </a>
            ) : (
              <Link
                className="mt-8 flex items-center justify-center border border-line px-5 py-4 text-sm font-semibold"
                href="/contact?topic=product"
                onClick={close}
              >
                제품 문의
              </Link>
            )}
          </nav>
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
