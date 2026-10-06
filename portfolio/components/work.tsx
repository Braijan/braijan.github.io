import Image from "next/image";
import { PROJECTS, type Project } from "@/lib/site";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

function ProjectRow({ project }: { project: Project }) {
  return (
    <article className="group grid gap-8 border-t border-border py-14 lg:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-12 lg:py-20">
      <p
        className="numeral font-serif text-7xl leading-none font-light tracking-tight lg:text-8xl"
        aria-hidden="true"
      >
        {project.index}
      </p>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.7rem] tracking-[0.18em] uppercase ${
              project.live
                ? "border-accent/30 text-accent"
                : "border-border text-muted-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${project.live ? "pulse bg-accent" : "bg-muted-foreground/60"}`}
              aria-hidden="true"
            />
            {project.status}
          </span>
          <span className="font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">
            {project.role}
          </span>
        </div>

        <h3 className="mt-6">
          {project.logo ? (
            <>
              <span className="sr-only">{project.name}</span>
              <Image
                src={project.logo.src}
                alt=""
                width={project.logo.width}
                height={project.logo.height}
                className="h-9 w-auto opacity-90 transition-opacity group-hover:opacity-100 sm:h-10"
              />
            </>
          ) : (
            <span className="font-serif text-5xl font-light tracking-tight">
              {project.name.toLowerCase()}
            </span>
          )}
        </h3>
        <p className="mt-4 font-serif text-xl font-normal text-accent italic">
          {project.tagline}
        </p>

        <dl className="mt-8 space-y-4">
          {project.facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline gap-4">
              <dt className="min-w-[3.5rem] font-serif text-3xl font-normal text-foreground tabular-nums">
                {fact.value}
              </dt>
              <dd className="text-sm text-muted-foreground">{fact.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col">
        <div className="space-y-5 text-pretty leading-relaxed text-foreground/85">
          {project.body.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex w-fit items-center gap-2 border-b border-accent/40 pb-1 font-mono text-xs tracking-[0.14em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
        >
          {project.linkLabel}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            ↗
          </span>
        </a>
      </div>
    </article>
  );
}

export function Work() {
  return (
    <section id="work" className="relative border-t border-border px-5 pt-24 sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-8 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <div>
            <SectionLabel index="02" label="Work" />
            <h2 className="mt-6 text-balance font-serif text-4xl leading-[1.05] font-light tracking-tight sm:text-5xl">
              Three systems, all in production or close to it.
            </h2>
          </div>
          <p className="self-end text-pretty text-lg leading-relaxed text-foreground/85">
            All three are ventures of The Smith Syndicate, the studio I run
            with my brother. Kiryn is also the tool I use to keep track of the
            sessions that build the other two, and all three were made the way
            the section above describes.
          </p>
        </Reveal>

        {PROJECTS.map((project) => (
          <Reveal key={project.name}>
            <ProjectRow project={project} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
