"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { siteConfig } from "@/config/site";
import { scrollToPageTop } from "@/lib/scroll-to-page-top";

export function HeaderLogoLink() {
  const pathname = usePathname();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const modifiedClick =
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;
    if (modifiedClick || pathname !== "/") return;
    event.preventDefault();
    scrollToPageTop();
  }

  return (
    <Link
      aria-label={`${siteConfig.brandNameKo} 홈`}
      className="flex items-center"
      href="/"
      id="site-logo-link"
      onClick={handleClick}
      scroll
    >
      <Image
        alt={siteConfig.logoAlt}
        className="h-12 w-auto md:h-14"
        height={64}
        priority
        src={siteConfig.logoPath}
        width={230}
      />
    </Link>
  );
}
