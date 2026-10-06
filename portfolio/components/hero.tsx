import { SITE } from "@/lib/site";
import { ParticlePortrait } from "./particle-portrait";

const NOW = [
  { label: "Day job", value: "Security Product Engineer, Enigma Networks" },
  { label: "Building", value: "Cruina, Omniira and Kiryn" },
  { label: "Writing", value: "Three papers on agent architecture" },
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden px-5 pt-28 pb-10 sm:px-8 lg:pt-32"
    >
      <div className="glow -z-20" aria-hidden="true" />

      {/* Portrait as a particle field: right side on desktop, behind the name on mobile */}
      <div
        className="reveal-slow absolute inset-x-0 top-0 -z-10 h-[64svh] lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[58%] xl:w-[54%]"
        style={{ animationDelay: "0.1s" }}
      >
        <ParticlePortrait
          src="/images/brian.jpg"
          focusX={0.62}
          focusY={0.3}
          fadeLeft
          className="h-full w-full touch-pan-y"
          label="Portrait of Brian Charles Smith drawn as a field of particles that scatter from the cursor and settle back"
        />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end pt-[34svh] lg:justify-center lg:pt-0">
        <a
          href={SITE.syndicate}
          target="_blank"
          rel="noopener noreferrer"
          className="reveal group inline-flex w-fit items-center gap-3 font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase"
        >
          <span className="pulse h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span>
            Co-founder,{" "}
            <span className="text-foreground underline decoration-accent/40 underline-offset-4 transition-colors group-hover:decoration-accent">
              The Smith Syndicate
            </span>
          </span>
        </a>

        <h1 className="mt-6 font-serif text-[clamp(3.6rem,13vw,10.5rem)] leading-[0.86] font-light tracking-[-0.035em] text-foreground">
          <span className="block overflow-hidden pb-[0.06em]">
            <span className="rise" style={{ animationDelay: "0.05s" }}>
              Brian
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <span
              className="rise pl-[0.6em] text-accent italic"
              style={{ animationDelay: "0.15s" }}
            >
              Charles
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <span className="rise" style={{ animationDelay: "0.25s" }}>
              Smith
            </span>
          </span>
        </h1>

        <p
          className="reveal mt-8 max-w-xl text-pretty text-lg leading-relaxed text-foreground/85 sm:text-xl"
          style={{ animationDelay: "0.5s" }}
        >
          I design agentic systems that ship to production, and the guardrails
          that let a company trust them.
        </p>

        <div
          className="reveal mt-9 flex flex-wrap gap-3"
          style={{ animationDelay: "0.65s" }}
        >
          <a
            href="#work"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            See the work
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-y-0.5"
            >
              ↓
            </span>
          </a>
          <a
            href="#contact"
            className="inline-flex items-center rounded-full border border-border bg-card/40 px-6 py-3 text-sm text-foreground backdrop-blur-sm transition-colors hover:border-foreground/40"
          >
            Get in touch
          </a>
        </div>
      </div>

      <dl
        className="reveal relative mx-auto mt-14 grid w-full max-w-7xl gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3"
        style={{ animationDelay: "0.8s" }}
      >
        {NOW.map((item) => (
          <div key={item.label} className="bg-background/80 px-5 py-4 backdrop-blur-md">
            <dt className="font-mono text-[0.65rem] tracking-[0.2em] text-accent/80 uppercase">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm text-foreground/90">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
