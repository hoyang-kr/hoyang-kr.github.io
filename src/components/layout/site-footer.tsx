import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, ExternalIcon } from "@/components/icons";
import { isPlaceholderValue } from "@/config/launch-data";
import { siteConfig } from "@/config/site";

type FooterCompanyDetail = {
  label: string;
  value: string;
  href?: string;
};
const footerLinks = [
  { label: "제품", href: "/products" },
  { label: "컬렉션", href: "/collections" },
  { label: "브랜드", href: "/about" },
  { label: "대리점", href: "/dealers" },
  { label: "고객지원", href: "/support" },
  { label: "문의", href: "/contact" },
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const companyDetails: FooterCompanyDetail[] = [
    {
      label: "회사명",
      value: siteConfig.business.companyName,
    },
    {
      label: "대표자",
      value: siteConfig.business.representative,
    },
    {
      label: "사업자등록번호",
      value: siteConfig.business.registrationNumber,
    },
    ...(siteConfig.business.mailOrderRegistrationRequired
      ? [
          {
            label: "통신판매업신고번호",
            value: siteConfig.business.mailOrderRegistrationNumber,
          },
        ]
      : []),
    {
      label: "사업장 주소",
      value: siteConfig.address,
    },
    {
      label: "고객센터",
      value: siteConfig.telephone,
      href: `tel:${siteConfig.telephone.replace(/[^\d+]/g, "")}`,
    },
    {
      label: "팩스",
      value: siteConfig.fax,
    },
    {
      label: "이메일",
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
    },
    {
      label: "운영시간",
      value: siteConfig.operatingHours,
    },
  ].filter(({ value }) => !isPlaceholderValue(value));

  return (
    <footer className="border-t border-line bg-stone text-ink">
      <div className="page-shell grid items-start gap-10 py-12 md:grid-cols-2 md:gap-x-16 md:gap-y-12 md:py-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(10rem,0.55fr)_minmax(21rem,0.8fr)] lg:gap-12">
        <div className="md:col-span-2 lg:col-span-1">
          <Link
            aria-label={`${siteConfig.brandNameKo} 홈`}
            className="inline-flex items-center"
            href="/"
          >
            <Image
              alt={siteConfig.logoAlt}
              className="h-auto w-28 md:w-32"
              height={462}
              src={siteConfig.logoPath}
              width={693}
            />
          </Link>
          <p className="mt-4 max-w-[21rem] text-sm leading-6 text-muted lg:max-w-none">
            {siteConfig.companyDescription}
          </p>
          {siteConfig.instagramUrl || siteConfig.naverBlogUrl ? (
            <div className="mt-6 flex gap-4 text-xs">
              {siteConfig.instagramUrl ? (
                <a
                  className="text-link"
                  href={siteConfig.instagramUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Instagram <ExternalIcon className="size-3" />
                </a>
              ) : null}
              {siteConfig.naverBlogUrl ? (
                <a
                  className="text-link"
                  href={siteConfig.naverBlogUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Naver Blog <ExternalIcon className="size-3" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="w-full max-w-48">
          <p className="mb-4 text-xs font-semibold tracking-[0.12em] text-brand">
            바로가기
          </p>
          <ul className="border-t border-line text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="group flex items-center justify-between border-b border-line py-2.5 text-ink/80 transition-colors hover:text-brand"
                  href={link.href}
                >
                  <span>{link.label}</span>
                  <ArrowRightIcon className="size-3.5 text-muted transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {companyDetails.length ? (
          <div className="w-full text-left md:max-w-[30rem] md:justify-self-end">
            <p className="mb-4 text-xs font-semibold tracking-[0.12em] text-brand">
              회사 정보
            </p>
            <dl className="grid gap-x-4 gap-y-3 text-xs leading-5 sm:grid-cols-[7.75rem_minmax(0,1fr)] sm:gap-y-2.5">
              {companyDetails.map((detail) => (
                <div
                  className="grid min-w-0 gap-0.5 sm:contents"
                  key={detail.label}
                >
                  <dt className="text-muted">{detail.label}</dt>
                  <dd className="min-w-0 break-words text-ink/80">
                    {detail.href ? (
                      <a
                        className="transition-colors hover:text-brand"
                        href={detail.href}
                      >
                        {detail.value}
                      </a>
                    ) : (
                      detail.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
      <div className="border-t border-ink bg-ink text-white">
        <div className="page-shell flex flex-col gap-3 py-4 text-[11px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {siteConfig.brandNameKo}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link className="hover:text-white" href="/privacy">
              개인정보처리방침
            </Link>
            <Link className="hover:text-white" href="/terms">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
