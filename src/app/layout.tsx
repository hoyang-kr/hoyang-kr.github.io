import type { Metadata, Viewport } from "next";

import "@/app/globals.css";
import { BackToTopButton } from "@/components/layout/back-to-top-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LanguageProvider } from "@/locales/language-provider";
import { isPreviewRelease } from "@/config/launch-data";
import { siteConfig } from "@/config/site";
import { buildOrganizationStructuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.seo.defaultTitle,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.defaultDescription,
  icons: {
    icon: siteConfig.faviconPath,
  },
  alternates: {
    canonical: "/",
  },
  robots: isPreviewRelease
    ? {
        index: false,
        follow: false,
        nocache: true,
      }
    : undefined,
  verification: {
    google: siteConfig.seo.searchEngineVerification.google || undefined,
    other: {
      ...(siteConfig.seo.searchEngineVerification.naver
        ? {
            "naver-site-verification": [
              siteConfig.seo.searchEngineVerification.naver,
            ],
          }
        : {}),
      ...Object.fromEntries(
        Object.entries(siteConfig.seo.searchEngineVerification.other).map(
          ([key, value]) => [key, [value]],
        ),
      ),
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: siteConfig.brandNameKo,
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    images: [
      {
        url: siteConfig.seo.openGraphImage,
        alt: `${siteConfig.brandNameKo} 소셜 공유 이미지`,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationStructuredData = buildOrganizationStructuredData();

  return (
    <html lang="ko">
      <body>
        <LanguageProvider>
          {organizationStructuredData ? (
            <script
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(organizationStructuredData).replace(
                  /</g,
                  "\\u003c",
                ),
              }}
              type="application/ld+json"
            />
          ) : null}
          <a
            className="fixed top-3 left-3 z-[100] -translate-y-20 bg-ink px-4 py-3 text-sm text-white transition-transform focus:translate-y-0"
            href="#main-content"
          >
            본문 바로가기
          </a>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <BackToTopButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
