"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { type Locale, translateText } from "@/locales/translations";

const STORAGE_KEY = "hoyang-language";
const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "ko", setLocale: () => undefined });

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();
const translatedAttributes = ["aria-label", "title", "placeholder"] as const;

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ko");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== "en") return;
    const timer = window.setTimeout(() => setLocale("en"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;

    const translateRoot = (root: Node) => {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      );
      let node: Node | null = root;
      while (node) {
        if (node instanceof Text) translateTextNode(node, locale);
        if (node instanceof Element) translateElementAttributes(node, locale);
        node = walker.nextNode();
      }
    };

    translateRoot(document.body);
    if (locale === "ko") return;

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData")
          translateTextNode(record.target as Text, locale, true);
        for (const node of record.addedNodes) translateRoot(node);
      }
    });
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

function translateTextNode(
  node: Text,
  locale: Locale,
  refreshOriginal = false,
) {
  const parent = node.parentElement;
  if (!parent || parent.closest("script, style, code, [data-no-translate]"))
    return;
  let original = originalText.get(node) ?? node.data;
  if (refreshOriginal && node.data !== replacePreservingWhitespace(original))
    original = node.data;
  originalText.set(node, original);
  const next =
    locale === "ko" ? original : replacePreservingWhitespace(original);
  if (node.data !== next) node.data = next;
}

function replacePreservingWhitespace(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return value.replace(trimmed, translateText(trimmed));
}

function translateElementAttributes(element: Element, locale: Locale) {
  if (element.closest("[data-no-translate]")) return;
  const stored = originalAttributes.get(element) ?? {};
  for (const attribute of translatedAttributes) {
    const current = element.getAttribute(attribute);
    if (current !== null && stored[attribute] === undefined)
      stored[attribute] = current;
    const original = stored[attribute];
    if (original === undefined) continue;
    const next = locale === "ko" ? original : translateText(original);
    if (element.getAttribute(attribute) !== next)
      element.setAttribute(attribute, next);
  }
  originalAttributes.set(element, stored);
}
