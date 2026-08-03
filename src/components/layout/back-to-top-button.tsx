"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@/components/icons";
import { scrollToPageTop } from "@/lib/scroll-to-page-top";

const SCROLL_THRESHOLD = 500;

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY >= SCROLL_THRESHOLD);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function returnToTop() {
    scrollToPageTop();
    document.getElementById("site-logo-link")?.focus({ preventScroll: true });
  }

  return (
    <button
      aria-hidden={visible ? undefined : true}
      aria-label="페이지 맨 위로 이동"
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex size-11 items-center justify-center rounded-full border border-line bg-warm-white text-ink shadow-sm transition-[opacity,transform,background-color,color] duration-200 hover:bg-ink hover:text-white focus-visible:outline md:right-7 md:bottom-7 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
      onClick={returnToTop}
      tabIndex={visible ? undefined : -1}
      title="맨 위로"
      type="button"
    >
      <ArrowUpIcon className="size-5" />
    </button>
  );
}
