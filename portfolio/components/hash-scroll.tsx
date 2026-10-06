"use client";

import { useEffect } from "react";

/**
 * In-page links scroll without writing their #hash into the address bar, so a refresh
 * starts at the top instead of jumping to whichever section was last clicked. A hash
 * that arrives from another page still lands on its section, then is dropped.
 */
export function HashScroll() {
  useEffect(() => {
    const clean = () => {
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    if (window.location.hash) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) requestAnimationFrame(() => target.scrollIntoView());
      clean();
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const link = (e.target as Element | null)?.closest?.("a");
      if (!link || link.classList.contains("skip-link")) return;
      const href = link.getAttribute("href");
      if (!href) return;

      const url = new URL(href, window.location.href);
      if (!url.hash || url.pathname !== window.location.pathname) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
      clean();
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
