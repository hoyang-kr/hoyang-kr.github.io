import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const screenshotDirectory = process.env.REVIEW_SCREENSHOT_DIR
  ? resolve(process.env.REVIEW_SCREENSHOT_DIR)
  : resolve(projectRoot, "docs/screenshots");
const baseUrl = process.env.REVIEW_BASE_URL ?? "http://localhost:3100";
const consoleErrors: string[] = [];
const failedRequests: string[] = [];

type Capture = {
  filename: string;
  path: string;
  viewport: "desktop" | "mobile";
  fullPage: boolean;
  state?: string;
};

const captures: Capture[] = [];

async function main() {
  await mkdir(screenshotDirectory, { recursive: true });
  const browser = await chromium.launch();

  try {
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "ko-KR",
    });
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "ko-KR",
      isMobile: true,
      hasTouch: true,
    });

    const desktopEnglish = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "en-US",
    });
    const mobileEnglish = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "en-US",
      isMobile: true,
      hasTouch: true,
    });
    await desktopEnglish.addInitScript(() =>
      localStorage.setItem("hoyang-language", "en"),
    );
    await mobileEnglish.addInitScript(() =>
      localStorage.setItem("hoyang-language", "en"),
    );

    await captureDesktop(desktop);
    await captureMobile(mobile);
    await captureRequestedCatalogRefresh(desktop, mobile);
    await captureFinishFilterStates(desktop, mobile);
    await captureLocalizedHome(
      desktopEnglish,
      "desktop",
      "19-home-en-desktop.png",
    );
    await captureLocalizedHome(
      mobileEnglish,
      "mobile",
      "20-home-en-mobile.png",
    );
    await captureHomepageSections(desktop);
    await captureCatalogUpdates(desktop);
    await captureRequestedChecks(browser);
    await captureHomepageAcceptance(browser);
    await captureGlobalSearchReview(browser);
    await desktop.close();
    await mobile.close();
    await desktopEnglish.close();
    await mobileEnglish.close();
  } finally {
    await browser.close();
  }

  const result = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    viewportSizes: {
      desktop: { width: 1440, height: 1000 },
      mobile: { width: 390, height: 844 },
    },
    captures,
    consoleErrors,
    failedRequests,
  };
  await writeFile(
    resolve(screenshotDirectory, "visual-review-results.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );

  console.log(`screenshots: ${captures.length}`);
  console.log(`console errors: ${consoleErrors.length}`);
  console.log(`failed requests: ${failedRequests.length}`);
  if (consoleErrors.length > 0 || failedRequests.length > 0) {
    process.exitCode = 1;
  }
}

async function captureDesktop(context: BrowserContext) {
  const page = await preparedPage(context, "desktop");
  const routes = [
    ["01-home-desktop.png", "/", true],
    ["02-products-desktop.png", "/products", true],
    ["03-collection-concord-desktop.png", "/collections/concord", true],
    ["04-hg-products-desktop.png", "/products?collection=hg-series", true],
    ["05-towel-bar-desktop.png", "/products/concord-towel-bar", true],
    [
      "06-paper-holder-desktop.png",
      "/products/belair-toilet-paper-holder",
      true,
    ],
    [
      "07-recessed-holder-desktop.png",
      "/products/hg110-1-recessed-holder",
      true,
    ],
    ["08-about-desktop.png", "/about", true],
    ["09-support-desktop.png", "/support", true],
    ["10-contact-desktop.png", "/contact", true],
  ] as const;

  for (const [filename, path, fullPage] of routes) {
    console.log(`capture: ${path}`);
    await visit(page, path);
    await screenshot(page, filename, "desktop", fullPage);
  }

  await visit(page, "/");
  await page.getByRole("button", { name: /^제품/ }).first().click();
  await screenshot(
    page,
    "11-mega-menu-desktop.png",
    "desktop",
    false,
    "제품 메가 메뉴 열림",
  );

  await visit(page, "/products?category=mirrors&collection=batuta");
  await page.getByText("조건에 맞는 제품이 없습니다.").waitFor();
  await screenshot(
    page,
    "12-empty-filter-desktop.png",
    "desktop",
    false,
    "공유 가능한 빈 필터 결과",
  );

  const response = await visit(page, "/not-a-real-route");
  if (response?.status() !== 404) {
    failedRequests.push(
      `custom 404 returned ${response?.status() ?? "no response"}`,
    );
  }
  await screenshot(page, "13-404-desktop.png", "desktop", false, "custom 404");
  await page.close();
}

async function captureMobile(context: BrowserContext) {
  const page = await preparedPage(context, "mobile");
  await visit(page, "/");
  await screenshot(page, "14-home-mobile.png", "mobile", true);

  await visit(page, "/products");
  await screenshot(page, "15-products-mobile.png", "mobile", true);

  await page.getByRole("button", { name: "메뉴 열기" }).click();
  const mobileMenu = page.getByRole("dialog", { name: "모바일 메뉴" });
  if (await mobileMenu.isVisible()) {
    await screenshot(
      page,
      "16-mobile-navigation.png",
      "mobile",
      false,
      "모바일 메뉴 열림",
    );
    await page.getByRole("button", { name: "메뉴 닫기" }).click();
  }

  await page.getByRole("button", { name: /^필터/ }).click();
  await page.getByRole("dialog", { name: "제품 필터" }).waitFor();
  await screenshot(
    page,
    "17-filter-drawer-mobile.png",
    "mobile",
    false,
    "모바일 필터 드로어 열림",
  );
  await page.getByRole("button", { name: "필터 닫기" }).click();

  await visit(page, "/products/saco-towel-bar");
  await page
    .getByRole("group", { name: "마감 선택" })
    .getByRole("button", { name: "마감: 크롬" })
    .click();
  await page
    .locator('img[alt*="사코 수건걸이 크롬"]')
    .waitFor({ state: "visible" });
  await screenshot(
    page,
    "18-finish-selector-mobile.png",
    "mobile",
    false,
    "크롬 마감 선택",
  );
  await page.close();
}

async function captureRequestedCatalogRefresh(
  desktopContext: BrowserContext,
  mobileContext: BrowserContext,
) {
  const desktop = await preparedPage(desktopContext, "desktop");
  await visit(desktop, "/");

  const categorySection = desktop
    .locator("section")
    .filter({ hasText: "Browse by category" })
    .first();
  await screenshotElement(
    categorySection,
    "60-home-category-representatives.png",
    "desktop",
    "HG112S recessed holder and HG999-2 shaving mirror category covers",
  );

  const collectionStory = desktop
    .locator("section")
    .filter({ hasText: "Featured collection" })
    .first();
  await screenshotElement(
    collectionStory,
    "61-home-featured-concord-story.png",
    "desktop",
    "Asymmetrical Concord featured-collection story",
  );

  await visit(desktop, "/collections");
  await screenshot(
    desktop,
    "62-collections-desktop.png",
    "desktop",
    true,
    "Collections desktop",
  );
  const belairCard = desktop
    .getByRole("link", { name: "벨레어 컬렉션 보기" })
    .locator("xpath=ancestor::article");
  const sacoCard = desktop
    .getByRole("link", { name: "사코 컬렉션 보기" })
    .locator("xpath=ancestor::article");
  await screenshotElement(
    belairCard,
    "64-collection-belair-towel-bar.png",
    "desktop",
    "Belair satin towel-bar collection cover",
  );
  await screenshotElement(
    sacoCard,
    "65-collection-saco-towel-bar.png",
    "desktop",
    "Saco towel-bar collection cover",
  );
  await screenshotElement(
    belairCard.locator("a").first(),
    "66-collection-image-canvas-closeup.png",
    "desktop",
    "Unified white collection image canvas",
  );

  await visit(desktop, "/products?collection=belair");
  const belairPaperCard = desktop
    .getByRole("link", { name: "바투타/벨레어 휴지걸이 상세 보기" })
    .first()
    .locator("xpath=ancestor::article");
  await screenshotElement(
    belairPaperCard,
    "67-shared-paper-holder-satin-only-card.png",
    "desktop",
    "Belair paper holder satin-only product card",
  );

  await visit(desktop, "/products/belair-toilet-paper-holder?finish=크롬");
  await screenshot(
    desktop,
    "68-shared-paper-holder-stale-chrome-fallback.png",
    "desktop",
    true,
    "Stale chrome URL safely falls back to satin",
  );
  await desktop.close();

  const mobile = await preparedPage(mobileContext, "mobile");
  await visit(mobile, "/collections");
  await screenshot(
    mobile,
    "63-collections-mobile.png",
    "mobile",
    true,
    "Collections mobile",
  );
  await mobile.close();
}

async function captureFinishFilterStates(
  desktopContext: BrowserContext,
  mobileContext: BrowserContext,
) {
  const desktop = await preparedPage(desktopContext, "desktop");

  await visit(desktop, "/products");
  await assertSacoPaperHolderFinish(desktop, "블랙");
  await screenshot(
    desktop,
    "50-products-no-finish.png",
    "desktop",
    true,
    "마감 필터 없음",
  );

  await visit(desktop, "/products?finish=크롬");
  const chromeCard = await assertSacoPaperHolderFinish(desktop, "크롬");
  await screenshot(
    desktop,
    "51-products-chrome.png",
    "desktop",
    true,
    "크롬 마감 필터",
  );
  await screenshotElement(
    chromeCard,
    "52-saco-paper-holder-chrome.png",
    "desktop",
    "크롬 필터의 사코 휴지걸이",
  );

  await chromeCard.getByRole("button", { name: "마감: 블랙" }).click();
  await assertSacoPaperHolderFinish(desktop, "블랙");

  await visit(desktop, "/products?finish=블랙");
  const blackCard = await assertSacoPaperHolderFinish(desktop, "블랙");
  await screenshot(
    desktop,
    "53-products-black.png",
    "desktop",
    true,
    "블랙 마감 필터",
  );
  await screenshotElement(
    blackCard,
    "54-saco-paper-holder-black.png",
    "desktop",
    "블랙 필터의 사코 휴지걸이",
  );

  await visit(desktop, "/products?finish=크롬");
  await assertSacoPaperHolderFinish(desktop, "크롬");
  await visit(desktop, "/products");
  await assertSacoPaperHolderFinish(desktop, "블랙");
  await screenshot(
    desktop,
    "56-products-filter-cleared.png",
    "desktop",
    true,
    "크롬 선택 후 필터 초기화",
  );
  await desktop.close();

  const mobile = await preparedPage(mobileContext, "mobile");
  await visit(mobile, "/products?finish=크롬");
  await assertSacoPaperHolderFinish(mobile, "크롬");
  await screenshot(
    mobile,
    "55-products-chrome-mobile.png",
    "mobile",
    true,
    "모바일 크롬 마감 필터",
  );
  await mobile.close();
}

async function assertSacoPaperHolderFinish(
  page: Page,
  finish: "크롬" | "블랙",
) {
  const detailLink = page
    .getByRole("link", { name: "사코 휴지걸이 상세 보기" })
    .first();
  const card = detailLink.locator("xpath=ancestor::article");
  await card
    .locator(`img[alt="사코 휴지걸이 ${finish} 제품 이미지"]`)
    .waitFor();

  const selectedChip = card.getByRole("button", {
    name: `마감: ${finish}`,
  });
  if ((await selectedChip.getAttribute("aria-pressed")) !== "true") {
    throw new Error(`사코 휴지걸이 ${finish} 칩이 선택되지 않았습니다.`);
  }

  const href = await detailLink.getAttribute("href");
  if (!href?.includes(`finish=${encodeURIComponent(finish)}`)) {
    throw new Error(
      `사코 휴지걸이 링크가 ${finish} 상세 상태를 가리키지 않습니다.`,
    );
  }

  return card;
}

async function screenshotElement(
  element: ReturnType<Page["locator"]>,
  filename: string,
  viewport: "desktop" | "mobile",
  state: string,
) {
  await element.scrollIntoViewIfNeeded();
  await element.screenshot({
    path: resolve(screenshotDirectory, filename),
    animations: "disabled",
  });
  captures.push({
    filename,
    path: `docs/screenshots/${filename}`,
    viewport,
    fullPage: false,
    state,
  });
}

async function captureLocalizedHome(
  context: BrowserContext,
  viewport: "desktop" | "mobile",
  filename: string,
) {
  const page = await preparedPage(context, viewport);
  await visit(page, "/");
  await page.locator('html[lang="en"]').waitFor();
  await page.getByText("Browse by category", { exact: true }).waitFor();
  await screenshot(page, filename, viewport, true, "English homepage");
  await page.close();
}

async function captureHomepageSections(context: BrowserContext) {
  const page = await preparedPage(context, "desktop");
  await visit(page, "/");
  const sections = [
    ["21-featured-collection-desktop.png", "Featured collection"],
    ["22-category-navigation-desktop.png", "Browse by category"],
    ["29-selected-products-desktop.png", "Selected products"],
  ] as const;
  for (const [filename, heading] of sections) {
    const section = page
      .locator("section")
      .filter({ hasText: heading })
      .first();
    await section.screenshot({
      path: resolve(screenshotDirectory, filename),
      animations: "disabled",
    });
    captures.push({
      filename,
      path: `docs/screenshots/${filename}`,
      viewport: "desktop",
      fullPage: false,
      state: heading,
    });
  }
  await page.close();
}
async function captureCatalogUpdates(context: BrowserContext) {
  const page = await preparedPage(context, "desktop");
  await visit(page, "/");
  const hero = page.locator("main > section").first();
  await hero.screenshot({
    path: resolve(screenshotDirectory, "23-hero-branding-desktop.png"),
    animations: "disabled",
  });
  captures.push({
    filename: "23-hero-branding-desktop.png",
    path: "docs/screenshots/23-hero-branding-desktop.png",
    viewport: "desktop",
    fullPage: false,
    state: "Quiet architectural hero with larger Korean headline",
  });

  await visit(page, "/products");
  for (const [filename, text] of [
    ["24-hg822c-card-desktop.png", "HG822C 이단수건선반"],
    ["25-hg822s-card-desktop.png", "HG822S 이단수건선반"],
    ["26-shared-paper-holder-satin-only.png", "바투타/벨레어 휴지걸이"],
    ["27-brio-paper-holder-chrome.png", "브리오 휴지걸이"],
  ] as const) {
    const card = page.locator("article").filter({ hasText: text }).first();
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({
      path: resolve(screenshotDirectory, filename),
      animations: "disabled",
    });
    captures.push({
      filename,
      path: "docs/screenshots/" + filename,
      viewport: "desktop",
      fullPage: false,
      state: text,
    });
  }
  await page.close();
}

async function captureRequestedChecks(browser: Browser) {
  for (const width of [390, 768, 1024, 1280, 1440]) {
    const context = await browser.newContext({
      viewport: {
        width,
        height:
          width === 390
            ? 844
            : width === 768
              ? 1024
              : width === 1440
                ? 1000
                : 900,
      },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "ko-KR",
      isMobile: width === 390,
      hasTouch: width === 390,
    });
    const page = await preparedPage(
      context,
      width === 390 ? "mobile" : "desktop",
    );
    await visit(page, "/");
    const hero = page.locator("main > section").first();
    const filename = `28-hero-${width}.png`;
    await hero.screenshot({
      path: resolve(screenshotDirectory, filename),
      animations: "disabled",
    });
    captures.push({
      filename,
      path: `docs/screenshots/${filename}`,
      viewport: width === 390 ? "mobile" : "desktop",
      fullPage: false,
      state: `Homepage editorial hero at ${width}px`,
    });
    await page.close();
    await context.close();
  }

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "ko-KR",
  });
  const page = await preparedPage(desktop, "desktop");
  await visit(page, "/");
  const heroStatement = page.getByText("HOYANG BATHROOM COLLECTION", {
    exact: true,
  });
  await heroStatement.screenshot({
    path: resolve(screenshotDirectory, "40-hero-eyebrow-closeup.png"),
    animations: "disabled",
  });
  captures.push({
    filename: "40-hero-eyebrow-closeup.png",
    path: "docs/screenshots/40-hero-eyebrow-closeup.png",
    viewport: "desktop",
    fullPage: false,
    state: "HOYANG bathroom collection eyebrow close-up",
  });

  const categorySection = page
    .locator("section")
    .filter({ hasText: "Browse by category" })
    .first();
  await categorySection.screenshot({
    path: resolve(screenshotDirectory, "32-category-section-normal.png"),
    animations: "disabled",
  });
  captures.push({
    filename: "32-category-section-normal.png",
    path: "docs/screenshots/32-category-section-normal.png",
    viewport: "desktop",
    fullPage: false,
    state: "Category cards, normal state",
  });
  const categoryCard = categorySection.locator("a:has(img)").first();
  await categoryCard.hover();
  await categoryCard.screenshot({
    path: resolve(screenshotDirectory, "33-category-card-hover.png"),
    animations: "disabled",
  });
  captures.push({
    filename: "33-category-card-hover.png",
    path: "docs/screenshots/33-category-card-hover.png",
    viewport: "desktop",
    fullPage: false,
    state: "Category card, hover state",
  });
  await categoryCard.locator("img").screenshot({
    path: resolve(screenshotDirectory, "34-category-image-edge.png"),
    animations: "disabled",
  });
  captures.push({
    filename: "34-category-image-edge.png",
    path: "docs/screenshots/34-category-image-edge.png",
    viewport: "desktop",
    fullPage: false,
    state: "Close category image edge",
  });

  await visit(page, "/products?category=towel-bars");
  await screenshot(
    page,
    "35-towel-bar-order.png",
    "desktop",
    true,
    "Requested towel-bar and towel-shelf order",
  );

  await visit(page, "/products?collection=batuta");
  const battutaCard = page
    .locator("article")
    .filter({ hasText: "바투타 수건걸이" })
    .first();
  await battutaCard.screenshot({
    path: resolve(screenshotDirectory, "41-battuta-towel-bar-card.png"),
    animations: "disabled",
  });
  captures.push({
    filename: "41-battuta-towel-bar-card.png",
    path: "docs/screenshots/41-battuta-towel-bar-card.png",
    viewport: "desktop",
    fullPage: false,
    state: "바투타 수건걸이 사틴 product card",
  });

  await visit(page, "/products/batuta-towel-bar");
  await screenshot(
    page,
    "42-battuta-towel-bar-detail.png",
    "desktop",
    true,
    "바투타 수건걸이 사틴 product detail",
  );

  await visit(page, "/products?collection=hg-series");
  for (const [filename, productName] of [
    ["43-hg100ms-clean-image.png", "HG100MS 코너선반"],
    ["44-hg110-1-clean-image.png", "HG110-1 매립휴지걸이"],
  ] as const) {
    const card = page
      .locator("article")
      .filter({ hasText: productName })
      .first();
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({
      path: resolve(screenshotDirectory, filename),
      animations: "disabled",
    });
    captures.push({
      filename,
      path: `docs/screenshots/${filename}`,
      viewport: "desktop",
      fullPage: false,
      state: `${productName} without embedded model label`,
    });
  }

  await page.addInitScript(() => localStorage.setItem("hoyang-language", "en"));
  for (const [filename, path, state] of [
    ["36-battuta-collections.png", "/collections", "battuta collection card"],
    [
      "37-battuta-detail.png",
      "/collections/batuta",
      "battuta collection heading",
    ],
    [
      "38-battuta-products.png",
      "/products?collection=batuta",
      "battuta product and filter labels",
    ],
  ] as const) {
    await visit(page, path);
    await page.locator('html[lang="en"]').waitFor();
    await screenshot(page, filename, "desktop", true, state);
  }
  await page.close();
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-US",
    isMobile: true,
    hasTouch: true,
  });
  await mobile.addInitScript(() =>
    localStorage.setItem("hoyang-language", "en"),
  );
  const mobilePage = await preparedPage(mobile, "mobile");
  await visit(mobilePage, "/");
  await mobilePage.getByRole("button", { name: "Open menu" }).click();
  await screenshot(
    mobilePage,
    "39-mobile-logo-navigation-battuta.png",
    "mobile",
    false,
    "HOYANG25 mobile navigation and battuta label",
  );
  await mobilePage.close();
  await mobile.close();
}

async function captureHomepageAcceptance(browser: Browser) {
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1280, height: 900 },
    { width: 1440, height: 1000 },
  ] as const;

  for (const { width, height } of viewports) {
    const mobileViewport = width < 1024;
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "ko-KR",
      isMobile: width === 390,
      hasTouch: width === 390,
    });
    const page = await preparedPage(
      context,
      mobileViewport ? "mobile" : "desktop",
    );
    await visit(page, "/");

    const editorialCards = page.locator(
      '[data-presentation="editorial"] article[data-presentation="editorial"]',
    );
    if ((await editorialCards.count()) !== 8) {
      throw new Error(`Expected 8 homepage editorial products at ${width}px.`);
    }
    if (
      (await editorialCards.getByText("Featured", { exact: true }).count()) > 0
    ) {
      throw new Error(
        `Homepage editorial cards show Featured badges at ${width}px.`,
      );
    }
    if ((await editorialCards.locator("button").count()) > 0) {
      throw new Error(
        `Homepage editorial cards show finish controls at ${width}px.`,
      );
    }
    if (
      (await page
        .getByText("Coordinated towel bars", { exact: true })
        .count()) > 0
    ) {
      throw new Error(
        "Removed coordinated towel-bar section is still present.",
      );
    }

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    if (hasHorizontalOverflow) {
      throw new Error(`Homepage has horizontal overflow at ${width}px.`);
    }

    await screenshot(
      page,
      `80-home-acceptance-${width}x${height}.png`,
      mobileViewport ? "mobile" : "desktop",
      true,
      `Homepage acceptance at ${width} × ${height}`,
    );
    await page.close();
    await context.close();
  }
}
async function captureGlobalSearchReview(browser: Browser) {
  const widths = [1440, 1024, 768, 375] as const;

  for (const width of widths) {
    const mobileViewport = width < 1024;
    const context = await browser.newContext({
      viewport: { width, height: mobileViewport ? 844 : 900 },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "ko-KR",
      isMobile: width === 375,
      hasTouch: width === 375,
    });
    const page = await preparedPage(
      context,
      mobileViewport ? "mobile" : "desktop",
    );
    await visit(page, "/");

    if (width === 1440) {
      await screenshot(
        page,
        "70-search-header-closed-1440.png",
        "desktop",
        false,
        "Closed desktop search header at 1440px",
      );
    }

    if (mobileViewport) {
      await page.getByRole("button", { name: "메뉴 열기" }).click();
      const searchInput = page.locator('[role="dialog"] input[type="search"]');
      await searchInput.fill("HG822C");
      await page.getByText("HG822C 이단수건선반").first().waitFor();
      await screenshot(
        page,
        width === 375
          ? "74-search-mobile-menu-375.png"
          : "73-search-mobile-menu-768.png",
        "mobile",
        false,
        "Mobile menu search with populated suggestions at " + width + "px",
      );
    } else {
      await page
        .locator('button[aria-controls="desktop-product-search"]')
        .click();
      const searchInput = page.locator(
        '#desktop-product-search input[type="search"]',
      );
      await searchInput.waitFor();
      await screenshot(
        page,
        width === 1440
          ? "71-search-open-desktop-1440.png"
          : "76-search-open-desktop-1024.png",
        "desktop",
        false,
        "Open desktop search at " + width + "px",
      );
      await searchInput.fill("HG822");
      await page.getByText("HG822C 이단수건선반").first().waitFor();
      await screenshot(
        page,
        width === 1440
          ? "72-search-suggestions-1440.png"
          : "77-search-suggestions-1024.png",
        "desktop",
        false,
        "Populated search suggestions at " + width + "px",
      );
      if (width === 1440) {
        await searchInput.fill("검색결과없음999");
        await page.getByText("검색 결과가 없습니다.").waitFor();
        await screenshot(
          page,
          "75-search-no-results-1440.png",
          "desktop",
          false,
          "Global search no-results state",
        );
      }
    }

    await page.close();
    await context.close();
  }

  const catalogContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "ko-KR",
  });
  const catalogPage = await preparedPage(catalogContext, "desktop");
  await visit(
    catalogPage,
    "/products?q=사코%20휴지걸이%20크롬&finish=크롬&collection=saco",
  );
  await catalogPage
    .getByRole("searchbox", { name: "제품명 또는 모델 번호 검색" })
    .waitFor();
  await screenshot(
    catalogPage,
    "78-catalog-search-active-filters-1440.png",
    "desktop",
    false,
    "Catalog search combined with chrome and Saco filters",
  );
  await catalogPage.close();
  await catalogContext.close();

  const behaviorContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "ko-KR",
  });
  const behaviorPage = await preparedPage(behaviorContext, "desktop");
  await visit(behaviorPage, "/");
  const trigger = behaviorPage.locator(
    'button[aria-controls="desktop-product-search"]',
  );
  await trigger.click();
  const overlayInput = behaviorPage.locator(
    '#desktop-product-search input[type="search"]',
  );
  await overlayInput.fill("HG822C");
  await behaviorPage.getByText("HG822C 이단수건선반").first().waitFor();
  await overlayInput.press("ArrowDown");
  if (!(await overlayInput.getAttribute("aria-activedescendant"))) {
    throw new Error(
      "Search suggestions did not expose an active keyboard option.",
    );
  }
  await overlayInput.press("Escape");
  await behaviorPage
    .locator("#desktop-product-search")
    .waitFor({ state: "hidden" });
  if (
    !(await trigger.evaluate((element) => element === document.activeElement))
  ) {
    throw new Error("Desktop search did not return focus to its trigger.");
  }

  await visit(behaviorPage, "/products");
  const catalogInput = behaviorPage.locator("#catalog-product-search");
  await catalogInput.fill("HG822C");
  await behaviorPage.waitForURL(
    (url) => url.searchParams.get("q") === "HG822C",
  );
  await behaviorPage
    .getByRole("checkbox", { name: "크롬", exact: true })
    .click();
  await behaviorPage.waitForURL(
    (url) =>
      url.searchParams.get("q") === "HG822C" &&
      url.searchParams.get("finish") === "크롬",
  );
  await visit(behaviorPage, "/products?q=HG1101");
  await behaviorPage.goBack();
  await behaviorPage.waitForURL(
    (url) =>
      url.searchParams.get("q") === "HG822C" &&
      url.searchParams.get("finish") === "크롬",
  );
  await behaviorPage.goForward();
  await behaviorPage.waitForURL(
    (url) => url.searchParams.get("q") === "HG1101",
  );
  await behaviorPage.close();
  await behaviorContext.close();
}

async function preparedPage(
  context: BrowserContext,
  viewport: "desktop" | "mobile",
) {
  const page = await context.newPage();
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !page.url().includes("/not-a-real-route")
    ) {
      consoleErrors.push(`[${viewport}] ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`[${viewport}] ${error.message}`);
  });
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      !response.url().includes("/not-a-real-route")
    ) {
      failedRequests.push(
        `[${viewport}] ${response.status()} ${response.url()}`,
      );
    }
  });
  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation:none!important;transition:none!important}",
  });
  return page;
}

async function visit(page: Page, path: string) {
  const response = await page.goto(`${baseUrl}${path}`, {
    waitUntil: "networkidle",
  });
  await page.locator("main").waitFor({ state: "attached" });
  return response;
}

async function screenshot(
  page: Page,
  filename: string,
  viewport: "desktop" | "mobile",
  fullPage: boolean,
  state?: string,
) {
  if (fullPage) {
    await loadLazyImages(page);
  }
  await page.screenshot({
    path: resolve(screenshotDirectory, filename),
    fullPage,
    animations: "disabled",
  });
  captures.push({
    filename,
    path: `docs/screenshots/${filename}`,
    viewport,
    fullPage,
    state,
  });
}

async function loadLazyImages(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((done) => {
      let position = 0;
      const step = Math.max(window.innerHeight * 0.8, 500);
      const timer = window.setInterval(() => {
        position += step;
        window.scrollTo(0, position);
        if (position >= document.documentElement.scrollHeight) {
          window.clearInterval(timer);
          done();
        }
      }, 80);
    });
  });
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
}

void main();
