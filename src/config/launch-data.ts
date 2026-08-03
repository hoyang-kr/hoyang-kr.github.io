import rawLaunchData from "../../data/launch/launch-data.json";

import {
  launchDataSchema,
  siteReleaseModeSchema,
  type SiteReleaseMode,
} from "@/config/launch-schema";

export const launchData = launchDataSchema.parse(rawLaunchData);

function resolveReleaseMode(): SiteReleaseMode {
  const configuredMode =
    process.env.NEXT_PUBLIC_SITE_RELEASE_MODE ??
    launchData.deployment.releaseMode;
  const result = siteReleaseModeSchema.safeParse(configuredMode);

  if (!result.success) {
    throw new Error(
      `NEXT_PUBLIC_SITE_RELEASE_MODE must be development, preview, or production; received "${configuredMode}".`,
    );
  }

  return result.data;
}

export const siteReleaseMode = resolveReleaseMode();
export const isProductionRelease = siteReleaseMode === "production";
export const isPreviewRelease = siteReleaseMode !== "production";

export function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "브랜드명" ||
    normalized === "brand name" ||
    normalized === "정보 준비 중" ||
    normalized.includes("example.com") ||
    normalized.includes("your-domain") ||
    normalized.includes("placeholder") ||
    normalized.includes("예시")
  );
}

export function isSafeHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isApprovedNaverUrl(value: string, requireProduct = false) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (!launchData.online.approvedNaverStoreHosts.includes(url.hostname)) {
      return false;
    }
    return !requireProduct || url.pathname.includes("/products/");
  } catch {
    return false;
  }
}
