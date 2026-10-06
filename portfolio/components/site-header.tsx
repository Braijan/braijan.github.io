"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV } from "@/lib/site";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div
        className={`mx-3 flex max-w-7xl items-center justify-between px-5 transition-all duration-300 md:mx-auto md:px-6 ${
          scrolled || open
            ? "mt-2 rounded-2xl border border-border bg-card/85 py-3 shadow-lg backdrop-blur-md"
            : "border border-transparent py-5"
        }`}
      >
        <Link
          href="/"
          className="group flex items-baseline gap-2 text-foreground"
          aria-label="Brian Charles Smith, home"
        >
          <span className="font-serif text-lg leading-none tracking-tight">
            B<span className="text-accent italic">c</span>S
          </span>
          <span className="hidden font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase transition-colors group-hover:text-foreground sm:inline">
            Brian Charles Smith
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-border md:hidden"
        >
          <span
            className={`block h-px w-4 bg-foreground transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-4 bg-foreground transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Primary"
          className="mx-3 mt-2 flex flex-col rounded-2xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur-md md:hidden"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
