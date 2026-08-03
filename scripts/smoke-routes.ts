import {
  isProductionRelease,
  siteReleaseMode,
} from "../src/config/launch-data";
import { catalogRedirects } from "../src/data/catalog-overrides";
import { getPublicRouteDefinitions } from "../src/lib/public-routes";
import { startProductionServer } from "./lib/production-server";

async function main() {
  const errors: string[] = [];
  const routes = [
    ...getPublicRouteDefinitions().map((route) => route.path),
    "/robots.txt",
    "/sitemap.xml",
  ];
  const server = await startProductionServer();
  try {
    for (const path of routes) {
      const response = await fetch(`${server.origin}${path}`, {
        redirect: "manual",
      });
      if (response.status !== 200) {
        errors.push(`${path}: expected 200, received ${response.status}`);
      }
    }

    for (const redirect of catalogRedirects) {
      const response = await fetch(`${server.origin}${redirect.source}`, {
        redirect: "manual",
      });
      if (![307, 308].includes(response.status)) {
        errors.push(
          `${redirect.source}: expected redirect, received ${response.status}`,
        );
      }
      if (response.headers.get("location") !== redirect.destination) {
        errors.push(
          `${redirect.source}: expected Location ${redirect.destination}, received ${response.headers.get("location")}`,
        );
      }
    }

    const missingResponse = await fetch(
      `${server.origin}/__route-smoke-missing__`,
      { redirect: "manual" },
    );
    if (missingResponse.status !== 404) {
      errors.push(
        `/__route-smoke-missing__: expected 404, received ${missingResponse.status}`,
      );
    }

    const headerResponse = await fetch(server.origin);
    const requiredHeaders = [
      "content-security-policy",
      "referrer-policy",
      "x-content-type-options",
      "permissions-policy",
    ];
    for (const header of requiredHeaders) {
      if (!headerResponse.headers.has(header)) {
        errors.push(`/: missing security header ${header}`);
      }
    }
    const hasHsts = headerResponse.headers.has("strict-transport-security");
    if (isProductionRelease !== hasHsts) {
      errors.push(
        `/: Strict-Transport-Security presence does not match ${siteReleaseMode} release mode`,
      );
    }
  } finally {
    await server.stop();
  }

  console.log(
    `Route smoke checked ${routes.length} routes in ${siteReleaseMode} mode.`,
  );
  if (errors.length > 0) {
    console.error(`Route smoke failed with ${errors.length} errors:`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Route smoke passed.");
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
