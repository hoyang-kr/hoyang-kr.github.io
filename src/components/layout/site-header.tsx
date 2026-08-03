import Link from "next/link";

import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { HeaderLogoLink } from "@/components/layout/header-logo-link";
import { LanguageSelector } from "@/components/layout/language-selector";

export function SiteHeader() {
  return (
    <>
      <div className="hidden border-b border-line bg-stone md:block">
        <div className="page-shell flex h-10 items-center justify-end gap-7 text-xs text-muted">
          <Link className="hover:text-ink" href="/contact?topic=product">
            제품 문의
          </Link>
          <Link className="hover:text-ink" href="/contact?topic=bulk">
            대량 구매 및 납품 문의
          </Link>
          <Link className="hover:text-ink" href="/support">
            고객지원
          </Link>
          <LanguageSelector />
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-warm-white">
        <div className="page-shell flex h-20 items-center justify-between lg:h-22">
          <HeaderLogoLink />
          <DesktopNavigation />
          <MobileNavigation />
        </div>
      </header>
    </>
  );
}
