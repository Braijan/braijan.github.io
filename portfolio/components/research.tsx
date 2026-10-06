import Link from "next/link";
import { getPaperTitles } from "@/lib/research";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

export function Research() {
  const papers = getPaperTitles();

  return (
    <section id="research" className="relative border-t border-border px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionLabel index="03" label="Research" />
            <h2 className="mt-6 text-balance font-serif text-4xl leading-[1.05] font-light tracking-tight sm:text-5xl">
              What Omniira has taught me about agents.
            </h2>
            <p className="mt-6 max-w-md text-pretty leading-relaxed text-foreground/70">
              These are working drafts from a live deployment. The observations
              come from a period when the code was still changing, and each
              paper says so plainly before it reports anything, while every
              claim about the system has been checked against the source code.
            </p>
          </Reveal>

          <ol className="space-y-4">
            {papers.map((paper, i) => (
              <Reveal as="li" key={paper.slug} delay={i * 100}>
                <Link
                  href={`/research/${paper.slug}`}
                  className="group block rounded-2xl border border-border bg-card/40 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card sm:p-8"
                >
                  <div className="flex items-center justify-between gap-4 font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                    <span>
                      <span className="text-accent">Paper {i + 1}</span>
                      {paper.version ? ` · Draft ${paper.version}` : null}
                    </span>
                    <span>{Math.round(paper.words / 230)} min read</span>
                  </div>
                  <h3 className="mt-5 text-balance font-serif text-2xl leading-snug font-light text-foreground sm:text-[1.7rem]">
                    {paper.title.replace(/^Omniira:\s*/, "")}
                  </h3>
                  <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {paper.summary}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-foreground uppercase transition-colors group-hover:text-accent">
                    Read the paper
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
