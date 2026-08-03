"use client";

export function trackOutboundClick(label: string, url: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("catalog:outbound-click", {
      detail: { label, url },
    }),
  );
}
