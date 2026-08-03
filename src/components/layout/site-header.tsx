import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { HeaderLogoLink } from "@/components/layout/header-logo-link";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-warm-white">
      <div className="page-shell flex h-20 items-center justify-between">
        <HeaderLogoLink />
        <DesktopNavigation />
        <MobileNavigation />
      </div>
    </header>
  );
}
