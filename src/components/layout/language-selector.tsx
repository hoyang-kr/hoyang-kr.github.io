"use client";

import { useLanguage } from "@/locales/language-provider";

export function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const { locale, setLocale } = useLanguage();
  return (
    <div
      aria-label={locale === "ko" ? "언어 선택" : "Select language"}
      className={
        mobile
          ? "flex items-center gap-2 border-b border-line py-5 text-xs"
          : "flex items-center gap-1 text-[11px]"
      }
      role="group"
    >
      <button
        aria-pressed={locale === "ko"}
        className={
          locale === "ko" ? "font-bold text-brand" : "text-muted hover:text-ink"
        }
        onClick={() => setLocale("ko")}
        type="button"
      >
        KR
      </button>
      <span aria-hidden="true" className="text-line">
        |
      </span>
      <button
        aria-pressed={locale === "en"}
        className={
          locale === "en" ? "font-bold text-brand" : "text-muted hover:text-ink"
        }
        onClick={() => setLocale("en")}
        type="button"
      >
        EN
      </button>
    </div>
  );
}
