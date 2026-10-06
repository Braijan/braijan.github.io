import { SITE } from "@/lib/site";
import { EmailLink } from "./email-link";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

const LINKS = [
  { label: "LinkedIn", href: SITE.linkedin },
  { label: "GitHub", href: SITE.github },
  { label: "The Smith Syndicate", href: SITE.syndicate },
];

export function Contact() {
  return (
    <section id="contact" className="relative isolate overflow-hidden border-t border-border px-5 py-24 sm:px-8 sm:py-36">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(46rem 26rem at 50% 100%, oklch(0.82 0.06 75 / 9%), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel index="05" label="Contact" />
          <h2 className="mt-8 max-w-4xl text-balance font-serif text-5xl leading-[1] font-light tracking-tight sm:text-7xl">
            If your team is working out how to put agents into production,{" "}
            <span className="text-accent italic">let&apos;s talk.</span>
          </h2>
        </Reveal>

        <Reveal delay={120} className="mt-14 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="group w-fit font-serif text-2xl font-light break-all text-foreground sm:text-4xl">
            <EmailLink className="border-b border-accent/40 pb-1 transition-colors hover:border-accent hover:text-accent" />
          </p>

          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-accent"
                >
                  {link.label}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
