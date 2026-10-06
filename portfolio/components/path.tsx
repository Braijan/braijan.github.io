import { PATH } from "@/lib/site";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

export function Path() {
  return (
    <section id="path" className="relative overflow-hidden border-t border-border px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <Reveal>
            <SectionLabel index="04" label="Path" />
            <h2 className="mt-6 text-balance font-serif text-4xl leading-[1.05] font-light tracking-tight sm:text-5xl">
              Chef, sergeant, restaurant owner, engineer.
            </h2>
          </Reveal>
          <Reveal delay={120} className="space-y-5 self-end text-pretty text-lg leading-relaxed text-foreground/85">
            <p>
              I came to software late and from a long way off. A kitchen line
              and a police sergeant&apos;s desk turn out to be good training
              for running autonomous agents, since both are about writing
              procedure that holds up when you aren&apos;t standing there, and
              knowing exactly who&apos;s allowed to make which call.
            </p>
          </Reveal>
        </div>

        <ol className="relative mt-20 grid gap-0 lg:grid-cols-6">
          <div
            className="absolute top-[0.45rem] right-0 left-0 hidden h-px bg-gradient-to-r from-border via-accent/40 to-accent lg:block"
            aria-hidden="true"
          />
          <div
            className="absolute top-0 bottom-0 left-[0.3rem] w-px bg-gradient-to-b from-border via-accent/40 to-accent lg:hidden"
            aria-hidden="true"
          />
          {PATH.map((station, i) => (
            <Reveal as="li" key={station.year} delay={i * 90} className="relative pb-12 pl-10 lg:pr-6 lg:pb-0 lg:pl-0">
              <span
                className={`absolute top-[0.1rem] left-0 block h-[0.7rem] w-[0.7rem] rounded-full border lg:top-0 ${
                  station.now
                    ? "pulse border-accent bg-accent"
                    : "border-accent/60 bg-background"
                }`}
                aria-hidden="true"
              />
              <p
                className={`font-mono text-xs tracking-[0.18em] uppercase lg:mt-8 ${
                  station.now ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {station.year}
              </p>
              <h3 className="mt-3 font-serif text-xl leading-snug font-normal">
                {station.title}
              </h3>
              <p className="mt-1 text-xs text-accent/80">{station.place}</p>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                {station.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
