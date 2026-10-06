import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {SITE.name}</p>
        <p>
          Built with agents, under the rules on this page ·{" "}
          <a
            href="https://github.com/Braijan/braijan.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/85 transition-colors hover:text-accent"
          >
            Source
          </a>
        </p>
      </div>
    </footer>
  );
}
