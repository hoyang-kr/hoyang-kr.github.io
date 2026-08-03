import type { MetadataRoute } from "next";

import { isProductionRelease } from "@/config/launch-data";
import { siteConfig } from "@/config/site";
import { getIndexablePublicPaths } from "@/lib/public-routes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isProductionRelease) return [];

  return getIndexablePublicPaths().map((path) => ({
    url: new URL(path, siteConfig.siteUrl).toString(),
    changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
    priority:
      path === "/"
        ? 1
        : path === "/products"
          ? 0.9
          : path.startsWith("/products/") || path.startsWith("/collections/")
            ? 0.7
            : 0.6,
  }));
}
