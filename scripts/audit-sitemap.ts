import sitemap from "../src/app/sitemap";
import {
  isProductionRelease,
  siteReleaseMode,
} from "../src/config/launch-data";
import { siteConfig } from "../src/config/site";
import {
  getIndexablePublicPaths,
  getPublicRouteDefinitions,
} from "../src/lib/public-routes";
import { startProductionServer } from "./lib/production-server";

async function main() {
  const entries = sitemap();
  const errors: string[] = [];
  const urls = entries.map((entry) => entry.url);
  const duplicateUrls = urls.filter(
    (url, index) => urls.indexOf(url) !== index,
  );
  if (duplicateUrls.length > 0) {
    errors.push(
      `duplicate sitemap URLs: ${[...new Set(duplicateUrls)].join(", ")}`,
    );
  }

  if (isProductionRelease) {
    const expectedPaths = getIndexablePublicPaths();
    const actualPaths = urls.flatMap((value) => {
      try {
        const url = new URL(value);
        if (/localhost|example|your-domain/i.test(url.hostname)) {
          errors.push(`disallowed sitemap hostname: ${url.hostname}`);
        }
        if (url.protocol !== "https:") {
          errors.push(`sitemap URL must use HTTPS: ${value}`);
        }
        return [url.pathname];
      } catch {
        errors.push(`invalid sitemap URL: ${value}`);
        return [];
      }
    });
    for (const path of expectedPaths) {
      if (!actualPaths.includes(path)) {
        errors.push(`intended indexable route missing from sitemap: ${path}`);
      }
    }
    for (const path of actualPaths) {
      if (!expectedPaths.includes(path)) {
        errors.push(`unexpected or noindex route included in sitemap: ${path}`);
      }
    }
  } else if (entries.length !== 0) {
    errors.push(
      `${siteReleaseMode} mode must emit an empty sitemap because the site is noindex`,
    );
  }

  const server = await startProductionServer();
  try {
    const sitemapResponse = await fetch(`${server.origin}/sitemap.xml`);
    if (!sitemapResponse.ok) {
      errors.push(`/sitemap.xml returned ${sitemapResponse.status}`);
    }
    const sitemapXml = await sitemapResponse.text();
    const locCount = [...sitemapXml.matchAll(/<loc>/g)].length;
    if (locCount !== entries.length) {
      errors.push(
        `/sitemap.xml contains ${locCount} URLs but the sitemap function returned ${entries.length}`,
      );
    }

    for (const entry of entries) {
      const expectedUrl = new URL(entry.url);
      const response = await fetch(`${server.origin}${expectedUrl.pathname}`);
      if (!response.ok) {
        errors.push(`${expectedUrl.pathname} returned ${response.status}`);
        continue;
      }
      const html = await response.text();
      const canonical = findCanonical(html);
      if (canonical !== entry.url) {
        errors.push(
          `${expectedUrl.pathname} canonical mismatch: expected ${entry.url}, received ${canonical || "<missing>"}`,
        );
      }
      if (/name="robots"[^>]*content="[^"]*noindex/i.test(html)) {
        errors.push(
          `${expectedUrl.pathname} is noindex but appears in sitemap`,
        );
      }
      validateStructuredData(html, expectedUrl.pathname, errors);
    }
  } finally {
    await server.stop();
  }

  const plannedRoutes = getPublicRouteDefinitions();
  console.log(`Sitemap audit mode: ${siteReleaseMode}`);
  console.log(`Sitemap URLs: ${entries.length}`);
  console.log(
    `Planned public routes: ${plannedRoutes.length} (${plannedRoutes.filter((route) => route.indexable).length} indexable when production is enabled)`,
  );
  console.log(`Canonical origin: ${siteConfig.siteUrl}`);
  if (errors.length > 0) {
    console.error(`Sitemap audit failed with ${errors.length} errors:`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Sitemap audit passed.");
  }
}

function findCanonical(html: string) {
  const tag = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/i)?.[0];
  return tag?.match(/\bhref="([^"]+)"/i)?.[1];
}

function validateStructuredData(html: string, path: string, errors: string[]) {
  const scripts = [
    ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
  ].filter((match) => /\btype=["']application\/ld\+json["']/i.test(match[1]));

  for (const script of scripts) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(script[2]);
    } catch {
      errors.push(`${path} emits invalid JSON-LD`);
      continue;
    }

    for (const entry of Array.isArray(parsed) ? parsed : [parsed]) {
      if (!entry || typeof entry !== "object") continue;
      const value = entry as Record<string, unknown>;
      const types = Array.isArray(value["@type"])
        ? value["@type"]
        : [value["@type"]];

      if (types.includes("Product")) {
        for (const field of [
          "offers",
          "aggregateRating",
          "review",
          "sku",
          "price",
        ]) {
          if (field in value) {
            errors.push(
              `${path} emits unsupported Product structured-data field "${field}"`,
            );
          }
        }
      }

      if (types.includes("Offer")) {
        errors.push(`${path} emits unsupported Offer structured data`);
      }
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
