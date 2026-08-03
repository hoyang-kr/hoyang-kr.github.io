import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium, type BrowserContext, type Page } from "playwright";

import { siteReleaseMode } from "../src/config/launch-data";
import { projectRoot } from "./lib/launch-data-files";
import { startProductionServer } from "./lib/production-server";

const routes = [
  { name: "homepage", path: "/" },
  { name: "product-listing", path: "/products" },
  {
    name: "towel-bar-detail",
    path: "/products/concord-towel-bar",
  },
  {
    name: "toilet-paper-holder-detail",
    path: "/products/belair-toilet-paper-holder",
  },
  {
    name: "hg-product-detail",
    path: "/products/hg110-1-recessed-holder",
  },
  { name: "collection", path: "/collections/concord" },
] as const;

type RouteAudit = {
  name: string;
  path: string;
  status: number | null;
  metrics: Awaited<ReturnType<typeof collectPageMetrics>>;
  consoleErrors: string[];
  failedResponses: string[];
  jsCoverage: {
    totalBytes: number;
    usedBytes: number;
    unusedPercent: number;
  };
};

async function main() {
  const server = await startProductionServer();
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  const routeAudits: RouteAudit[] = [];
  const interactionFindings: string[] = [];

  try {
    browser = await chromium.launch();
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "ko-KR",
    });
    for (const route of routes) {
      routeAudits.push(await auditRoute(desktop, server.origin, route));
    }
    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "ko-KR",
      isMobile: true,
      hasTouch: true,
    });
    await auditMobileInteractions(mobile, server.origin, interactionFindings);
    await mobile.close();
  } finally {
    await browser?.close();
    await server.stop();
  }

  const findings = routeAudits.flatMap((audit) => {
    const routeFindings: string[] = [];
    if (audit.status !== 200) {
      routeFindings.push(
        `${audit.path}: HTTP ${audit.status ?? "no response"}`,
      );
    }
    routeFindings.push(...audit.consoleErrors, ...audit.failedResponses);
    const { accessibility } = audit.metrics;
    if (accessibility.h1Count !== 1) {
      routeFindings.push(
        `${audit.path}: expected one h1, found ${accessibility.h1Count}`,
      );
    }
    for (const issue of accessibility.headingSkips) {
      routeFindings.push(`${audit.path}: ${issue}`);
    }
    for (const issue of accessibility.missingAlt) {
      routeFindings.push(`${audit.path}: ${issue}`);
    }
    for (const issue of accessibility.unlabeledControls) {
      routeFindings.push(`${audit.path}: ${issue}`);
    }
    for (const issue of accessibility.contrastFailures) {
      routeFindings.push(`${audit.path}: ${issue}`);
    }
    if (accessibility.horizontalOverflow) {
      routeFindings.push(`${audit.path}: horizontal document overflow`);
    }
    if (!accessibility.focusVisible) {
      routeFindings.push(`${audit.path}: first keyboard focus is not visible`);
    }
    if (!accessibility.reducedMotionApplied) {
      routeFindings.push(
        `${audit.path}: reduced-motion media preference did not suppress transitions`,
      );
    }
    return routeFindings;
  });
  findings.push(...interactionFindings);

  const result = {
    auditedAt: new Date().toISOString(),
    releaseMode: siteReleaseMode,
    browser: "Chromium via Playwright",
    routes: routeAudits,
    interactionFindings,
    findings,
  };
  await writeFile(
    resolve(projectRoot, "docs/launch-quality-results.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );

  console.log(`Quality audit routes: ${routeAudits.length}`);
  for (const audit of routeAudits) {
    console.log(
      `${audit.name}: LCP ${Math.round(audit.metrics.performance.lcpMs)}ms, CLS ${audit.metrics.performance.cls.toFixed(3)}, JS unused ${audit.jsCoverage.unusedPercent.toFixed(1)}%`,
    );
  }
  console.log(`Quality findings: ${findings.length}`);
  for (const finding of findings) console.log(`- ${finding}`);
  if (findings.length > 0) process.exitCode = 1;
}

async function auditRoute(
  context: BrowserContext,
  origin: string,
  route: (typeof routes)[number],
): Promise<RouteAudit> {
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`${route.path}: console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`${route.path}: page error: ${error.message}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(
        `${route.path}: ${response.status()} ${response.url()}`,
      );
    }
  });
  await installPerformanceObservers(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.startPreciseCoverage", {
    callCount: true,
    detailed: true,
  });
  const response = await page.goto(`${origin}${route.path}`, {
    waitUntil: "networkidle",
  });
  await page.locator("main").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
  await page.keyboard.press("Tab");
  const metrics = await collectPageMetrics(page);
  const coverageResult = await cdp.send("Profiler.takePreciseCoverage");
  await cdp.send("Profiler.stopPreciseCoverage");
  await cdp.detach();
  const jsCoverage = summarizeCoverage(coverageResult.result);
  await page.close();

  return {
    name: route.name,
    path: route.path,
    status: response?.status() ?? null,
    metrics,
    consoleErrors,
    failedResponses,
    jsCoverage,
  };
}

async function installPerformanceObservers(page: Page) {
  await page.addInitScript(() => {
    const auditWindow = window as typeof window & {
      __launchQualityMetrics?: { lcpMs: number; cls: number };
    };
    auditWindow.__launchQualityMetrics = { lcpMs: 0, cls: 0 };
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries.at(-1) as
          | (PerformanceEntry & { renderTime?: number; loadTime?: number })
          | undefined;
        if (last && auditWindow.__launchQualityMetrics) {
          auditWindow.__launchQualityMetrics.lcpMs =
            last.renderTime || last.loadTime || last.startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & { value: number; hadRecentInput: boolean }
        >) {
          if (!entry.hadRecentInput && auditWindow.__launchQualityMetrics) {
            auditWindow.__launchQualityMetrics.cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // Older browser engines may not expose the paint observers.
    }
  });
}

async function collectPageMetrics(page: Page) {
  return page.evaluate(() => {
    const auditWindow = window as typeof window & {
      __launchQualityMetrics?: { lcpMs: number; cls: number };
    };
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const headings = Array.from(
      document.querySelectorAll<HTMLHeadingElement>("h1,h2,h3,h4,h5,h6"),
    ).filter(isVisible);
    const headingSkips: string[] = [];
    for (let index = 1; index < headings.length; index += 1) {
      const previousLevel = Number(headings[index - 1].tagName.slice(1));
      const level = Number(headings[index].tagName.slice(1));
      if (level > previousLevel + 1) {
        headingSkips.push(
          `heading level skips from ${headings[index - 1].tagName} to ${headings[index].tagName} at "${headings[index].textContent?.trim().slice(0, 50)}"`,
        );
      }
    }
    const missingAlt = Array.from(document.querySelectorAll("img"))
      .filter((image) => !image.hasAttribute("alt"))
      .map((image) => `image missing alt: ${image.getAttribute("src")}`);
    const unlabeledControls = Array.from(
      document.querySelectorAll<HTMLElement>(
        "button, a[href], input, select, textarea",
      ),
    )
      .filter(isVisible)
      .filter((element) => accessibleName(element) === "")
      .map(
        (element) =>
          `unlabeled ${element.tagName.toLowerCase()}: ${element.outerHTML.slice(0, 100)}`,
      );
    const contrastFailures = findContrastFailures();
    const active = document.activeElement as HTMLElement | null;
    const activeStyle = active ? getComputedStyle(active) : null;
    const focusVisible =
      active !== null &&
      active !== document.body &&
      ((activeStyle?.outlineStyle !== "none" &&
        Number.parseFloat(activeStyle?.outlineWidth ?? "0") > 0) ||
        (activeStyle?.boxShadow ?? "none") !== "none");
    const transitionDurations = Array.from(
      document.querySelectorAll<HTMLElement>("*"),
    )
      .filter(isVisible)
      .flatMap((element) =>
        getComputedStyle(element)
          .transitionDuration.split(",")
          .map(parseDuration),
      );
    const imageSizing = Array.from(
      document.querySelectorAll<HTMLImageElement>("img"),
    )
      .filter(isVisible)
      .map((image) => {
        const rect = image.getBoundingClientRect();
        const source = image.currentSrc || image.src;
        const isVector = /\.svg(?:$|\?)/i.test(source);
        const renderedPixels =
          Math.max(rect.width, 1) *
          Math.max(rect.height, 1) *
          window.devicePixelRatio ** 2;
        return {
          alt: image.alt,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          renderedWidth: Math.round(rect.width),
          renderedHeight: Math.round(rect.height),
          source,
          isVector,
          overDeliveryRatio: isVector
            ? null
            : (image.naturalWidth * image.naturalHeight) / renderedPixels,
        };
      });
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    return {
      performance: {
        lcpMs: auditWindow.__launchQualityMetrics?.lcpMs ?? 0,
        cls: auditWindow.__launchQualityMetrics?.cls ?? 0,
        domContentLoadedMs: navigation.domContentLoadedEventEnd,
        loadMs: navigation.loadEventEnd,
        transferBytes: resources.reduce(
          (total, resource) => total + resource.transferSize,
          0,
        ),
        scriptTransferBytes: resources
          .filter((resource) => resource.initiatorType === "script")
          .reduce((total, resource) => total + resource.transferSize, 0),
      },
      accessibility: {
        h1Count: headings.filter((heading) => heading.tagName === "H1").length,
        headingSkips,
        missingAlt,
        unlabeledControls,
        contrastFailures,
        horizontalOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
        focusVisible,
        reducedMotionApplied: Math.max(0, ...transitionDurations) <= 0.001,
        fontsStatus: document.fonts.status,
      },
      images: imageSizing,
    };

    function isVisible(element: Element) {
      const htmlElement = element as HTMLElement;
      const style = getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    function accessibleName(element: HTMLElement) {
      const labelledBy = element.getAttribute("aria-labelledby");
      const labelledText = labelledBy
        ?.split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ");
      const input = element as HTMLInputElement;
      const labelText =
        input.labels && input.labels.length > 0
          ? Array.from(input.labels)
              .map((label) => label.textContent ?? "")
              .join(" ")
          : "";
      return (
        element.getAttribute("aria-label") ||
        labelledText ||
        labelText ||
        element.getAttribute("title") ||
        element.textContent ||
        ""
      ).trim();
    }

    function parseDuration(value: string) {
      const trimmed = value.trim();
      if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed) / 1000;
      if (trimmed.endsWith("s")) return Number.parseFloat(trimmed);
      return 0;
    }

    function findContrastFailures() {
      const failures: string[] = [];
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          "p,a,button,label,dt,dd,li,h1,h2,h3,h4,h5,h6",
        ),
      ).filter(
        (element) =>
          isVisible(element) &&
          (element.childElementCount === 0 ||
            Array.from(element.childNodes).some(
              (node) =>
                node.nodeType === Node.TEXT_NODE &&
                (node.textContent?.trim().length ?? 0) > 0,
            )),
      );
      for (const element of elements) {
        const style = getComputedStyle(element);
        const foreground = parseColor(style.color);
        const background = findBackground(element);
        if (!foreground || !background) continue;
        const ratio = contrastRatio(foreground, background);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const large =
          fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const minimum = large ? 3 : 4.5;
        if (ratio + 0.05 < minimum) {
          failures.push(
            `contrast ${ratio.toFixed(2)}:1 below ${minimum}:1 at "${element.textContent?.trim().replace(/\s+/g, " ").slice(0, 60)}"`,
          );
          if (failures.length >= 10) break;
        }
      }
      return failures;
    }

    function findBackground(element: HTMLElement) {
      let current: HTMLElement | null = element;
      while (current) {
        const color = parseColor(getComputedStyle(current).backgroundColor);
        if (color && color[3] > 0.95) return color;
        current = current.parentElement;
      }
      return [255, 255, 255, 1] as const;
    }

    function parseColor(value: string) {
      const match = value.match(
        /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*[,/]\s*([\d.]+))?\s*\)/,
      );
      if (!match) return null;
      return [
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        match[4] === undefined ? 1 : Number(match[4]),
      ] as const;
    }

    function contrastRatio(
      foreground: readonly number[],
      background: readonly number[],
    ) {
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function luminance(color: readonly number[]) {
      const channels = color.slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }
  });
}

function summarizeCoverage(
  scripts: Array<{
    url: string;
    functions: Array<{
      ranges: Array<{ startOffset: number; endOffset: number; count: number }>;
    }>;
  }>,
) {
  let totalBytes = 0;
  let usedBytes = 0;
  for (const script of scripts) {
    if (!script.url || !script.url.includes("/_next/")) continue;
    const allRanges = script.functions.flatMap((fn) => fn.ranges);
    const scriptLength = Math.max(
      0,
      ...allRanges.map((range) => range.endOffset),
    );
    totalBytes += scriptLength;
    usedBytes += calculateCoveredBytes(allRanges);
  }
  return {
    totalBytes,
    usedBytes,
    unusedPercent:
      totalBytes === 0 ? 0 : ((totalBytes - usedBytes) / totalBytes) * 100,
  };
}

function calculateCoveredBytes(
  ranges: Array<{ startOffset: number; endOffset: number; count: number }>,
) {
  const boundaries = [
    ...new Set(ranges.flatMap((range) => [range.startOffset, range.endOffset])),
  ].sort((a, b) => a - b);
  let covered = 0;
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    const innermost = ranges
      .filter((range) => range.startOffset <= start && range.endOffset >= end)
      .sort(
        (a, b) => a.endOffset - a.startOffset - (b.endOffset - b.startOffset),
      )[0];
    if (innermost?.count && end > start) covered += end - start;
  }
  return covered;
}

async function auditMobileInteractions(
  context: BrowserContext,
  origin: string,
  findings: string[],
) {
  const page = await context.newPage();
  await page.goto(`${origin}/products`, { waitUntil: "networkidle" });
  const menuTrigger = page.getByRole("button", { name: "메뉴 열기" });
  await menuTrigger.click();
  const closeMenu = page.getByRole("button", { name: "메뉴 닫기" });
  if (
    !(await closeMenu.evaluate((element) => element === document.activeElement))
  ) {
    findings.push("mobile navigation: focus did not move into dialog");
  }
  await page.keyboard.press("Escape");
  if (
    !(await menuTrigger.evaluate(
      (element) => element === document.activeElement,
    ))
  ) {
    findings.push("mobile navigation: Escape did not restore trigger focus");
  }

  const filterTrigger = page.getByRole("button", { name: /^필터/ });
  await filterTrigger.click();
  const closeFilter = page.getByRole("button", { name: "필터 닫기" });
  if (
    !(await closeFilter.evaluate(
      (element) => element === document.activeElement,
    ))
  ) {
    findings.push("mobile filters: focus did not move into dialog");
  }
  await page.keyboard.press("Escape");
  if (
    !(await filterTrigger.evaluate(
      (element) => element === document.activeElement,
    ))
  ) {
    findings.push("mobile filters: Escape did not restore trigger focus");
  }
  await page.close();
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
