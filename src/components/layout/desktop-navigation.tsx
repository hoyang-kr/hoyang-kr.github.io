"use client";

import { type FocusEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  ChevronDownIcon,
  CloseIcon,
  ExternalIcon,
  SearchIcon,
} from "@/components/icons";
import { LanguageSelector } from "@/components/layout/language-selector";
import { GlobalSearch } from "@/components/search/global-search";
import { siteConfig } from "@/config/site";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { finishes } from "@/data/products";

const dropdownTriggerClass =
  "nav-trigger flex h-full items-center gap-1 px-2.5 text-sm font-medium tracking-[-0.01em] transition-colors hover:text-muted xl:gap-1.5 xl:px-3.5 xl:text-[15px]";

type MenuKey = "products" | "collections" | "finishes";

export function DesktopNavigation() {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Record<MenuKey, HTMLButtonElement | null>>({
    products: null,
    collections: null,
    finishes: null,
  });

  useEffect(() => {
    if (!openMenu && !searchOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !navigationRef.current?.contains(event.target)
      ) {
        setOpenMenu(null);
        setSearchOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (searchOpen) {
        setSearchOpen(false);
        searchTriggerRef.current?.focus();
        return;
      }
      if (openMenu) {
        const activeMenu = openMenu;
        setOpenMenu(null);
        triggerRefs.current[activeMenu]?.focus();
      }
    };
    const onScroll = () => {
      setOpenMenu(null);
      setSearchOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [openMenu, searchOpen]);

  const closeMenu = () => setOpenMenu(null);
  const toggleMenu = (menu: MenuKey) => {
    setSearchOpen(false);
    setOpenMenu((current) => (current === menu ? null : menu));
  };
  const closeWhenFocusLeaves = (event: FocusEvent<HTMLElement>) => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    closeMenu();
  };

  return (
    <nav
      aria-label="주 메뉴"
      className="ml-auto hidden h-full items-stretch lg:flex"
      onBlur={closeWhenFocusLeaves}
      onMouseLeave={closeMenu}
      ref={navigationRef}
    >
      <div>
        <button
          aria-controls="desktop-products-menu"
          aria-expanded={openMenu === "products"}
          className={dropdownTriggerClass}
          data-open={openMenu === "products"}
          onClick={() => toggleMenu("products")}
          ref={(node) => {
            triggerRefs.current.products = node;
          }}
          type="button"
        >
          제품
          <ChevronDownIcon
            className={`size-3.5 transition-transform ${
              openMenu === "products" ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          aria-hidden={openMenu !== "products"}
          aria-label="제품 메뉴"
          className="mega-panel absolute inset-x-0 top-full z-40 border-y border-line bg-stone"
          data-open={openMenu === "products"}
          id="desktop-products-menu"
        >
          <div className="page-shell grid grid-cols-[1.5fr_0.7fr] gap-16 py-10">
            <div>
              <p className="eyebrow mb-5">제품 카테고리</p>
              <div className="grid grid-cols-2 gap-x-12">
                <Link
                  className="mega-link font-medium"
                  href="/products"
                  onClick={closeMenu}
                >
                  전체 제품
                </Link>
                {categories.map((category) => (
                  <Link
                    className="mega-link"
                    href={`/products?category=${category.id}`}
                    key={category.id}
                    onClick={closeMenu}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-l border-line pl-10">
              <p className="eyebrow mb-5">빠른 탐색</p>
              <p className="max-w-sm text-sm leading-6 text-muted">
                카테고리, 컬렉션, 마감 조건으로 필요한 제품을 간편하게
                찾아보세요.
              </p>
              <Link
                className="text-link mt-6 inline-flex"
                href="/products"
                onClick={closeMenu}
              >
                제품 카탈로그
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div>
        <button
          aria-controls="desktop-collections-menu"
          aria-expanded={openMenu === "collections"}
          className={dropdownTriggerClass}
          data-open={openMenu === "collections"}
          onClick={() => toggleMenu("collections")}
          ref={(node) => {
            triggerRefs.current.collections = node;
          }}
          type="button"
        >
          컬렉션
          <ChevronDownIcon
            className={`size-3.5 transition-transform ${
              openMenu === "collections" ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          aria-hidden={openMenu !== "collections"}
          aria-label="컬렉션 메뉴"
          className="mega-panel absolute inset-x-0 top-full z-40 border-y border-line bg-stone"
          data-open={openMenu === "collections"}
          id="desktop-collections-menu"
        >
          <div className="page-shell py-10">
            <div className="mb-5 flex items-center justify-between">
              <p className="eyebrow">컬렉션</p>
              <Link
                className="text-link inline-flex text-xs"
                href="/collections"
                onClick={closeMenu}
              >
                전체 컬렉션
              </Link>
            </div>
            <div className="grid grid-cols-6 divide-x divide-line border-y border-line">
              {collections.map((collection) => (
                <Link
                  className="group/item px-5 py-7 transition-colors hover:bg-stone"
                  href={`/collections/${collection.slug}`}
                  key={collection.id}
                  onClick={closeMenu}
                >
                  <span className="block text-base font-medium">
                    {collection.nameKo}
                  </span>
                  <span className="mt-2 block text-xs tracking-[0.12em] text-muted uppercase">
                    {collection.nameEn}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <button
          aria-controls="desktop-finishes-menu"
          aria-expanded={openMenu === "finishes"}
          className={dropdownTriggerClass}
          data-open={openMenu === "finishes"}
          onClick={() => toggleMenu("finishes")}
          ref={(node) => {
            triggerRefs.current.finishes = node;
          }}
          type="button"
        >
          마감
          <ChevronDownIcon
            className={`size-3.5 transition-transform ${
              openMenu === "finishes" ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          aria-hidden={openMenu !== "finishes"}
          aria-label="마감 메뉴"
          className="mega-panel absolute left-1/2 z-40 w-72 -translate-x-1/2 border border-line bg-stone p-3"
          data-open={openMenu === "finishes"}
          id="desktop-finishes-menu"
        >
          {finishes.map((finish) => (
            <Link
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-stone"
              href={`/products?finish=${finish}`}
              key={finish}
              onClick={closeMenu}
            >
              <span className={`finish-swatch finish-${finish}`} />
              {finish}
            </Link>
          ))}
        </div>
      </div>

      <Link
        className="flex h-full items-center px-2.5 text-sm font-medium hover:text-muted xl:px-3.5 xl:text-[15px]"
        href="/about"
      >
        브랜드
      </Link>
      <Link
        className="flex h-full items-center px-2.5 text-sm font-medium hover:text-muted xl:px-3.5 xl:text-[15px]"
        href="/dealers"
      >
        대리점
      </Link>
      <Link
        className="flex h-full items-center px-2.5 text-sm font-medium hover:text-muted xl:px-3.5 xl:text-[15px]"
        href="/support"
      >
        고객지원
      </Link>
      <button
        aria-controls="desktop-product-search"
        aria-expanded={searchOpen}
        aria-label="제품 검색"
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 self-center px-2 text-sm font-medium hover:text-brand xl:px-3"
        onClick={() => {
          setOpenMenu(null);
          setSearchOpen((current) => !current);
        }}
        ref={searchTriggerRef}
        type="button"
      >
        <SearchIcon className="size-5" />
        <span className="hidden 2xl:inline">검색</span>
      </button>
      {searchOpen ? (
        <div
          className="absolute inset-x-0 top-full z-50 border-y border-line bg-white"
          id="desktop-product-search"
        >
          <div className="page-shell py-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">제품 검색</p>
              <button
                aria-label="검색 닫기"
                className="flex size-11 items-center justify-center hover:text-brand"
                onClick={() => {
                  setSearchOpen(false);
                  searchTriggerRef.current?.focus();
                }}
                type="button"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <GlobalSearch
              autoFocus
              onClose={() => {
                setSearchOpen(false);
                searchTriggerRef.current?.focus();
              }}
              onNavigate={() => setSearchOpen(false)}
            />
          </div>
        </div>
      ) : null}
      <div className="flex min-h-11 items-center self-center px-1.5 xl:px-2.5">
        <LanguageSelector />
      </div>
      {siteConfig.naverSmartStoreUrl ? (
        <a
          className="ml-1 flex min-h-11 items-center gap-1.5 self-center border border-line px-3 text-xs font-semibold transition-colors hover:border-brand hover:text-brand xl:ml-2 xl:px-4"
          href={siteConfig.naverSmartStoreUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          네이버 스토어
          <ExternalIcon className="size-3.5" />
        </a>
      ) : (
        <Link
          className="ml-1 flex min-h-11 items-center gap-1.5 self-center border border-line px-3 text-xs font-semibold transition-colors hover:border-brand hover:text-brand xl:ml-2 xl:px-4"
          href="/contact?topic=product"
        >
          제품 문의
        </Link>
      )}
    </nav>
  );
}
