import { Boundary } from "./boundary";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

const SETUP = [
  {
    title: "Instructions in layers",
    body: "Four levels of standing instructions: global, workspace, product and repository. A session inherits whichever apply to the directory it starts in, so a rule is written once at the level where it's true.",
  },
  {
    title: "Plans an agent can verify",
    body: "Work starts as a written plan with acceptance criteria that check themselves. Agent teams plan, build, review and verify against it, and the pull request body is the record.",
  },
  {
    title: "A hard floor",
    body: "Secrets and production sit behind rules no in-session instruction can override, backed by a hook that blocks the command before it runs.",
  },
  {
    title: "Eyes on the fleet",
    body: "Several sessions run at once across repos. I built Kiryn to see which one is waiting on me.",
  },
];

export function Practice() {
  return (
    <section id="practice" className="relative border-t border-border px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <Reveal>
            <SectionLabel index="01" label="Practice" />
            <h2 className="mt-6 text-balance font-serif text-4xl leading-[1.05] font-light tracking-tight sm:text-5xl">
              I build with a team of agents and decide where they&apos;re
              allowed to go.
            </h2>
          </Reveal>

          <Reveal delay={120} className="space-y-5 text-pretty text-lg leading-relaxed text-foreground/80">
            <p>
              Most of the code I ship now is written by Claude Code sessions
              running side by side, each one working from a plan whose
              acceptance criteria it can check on its own. My part of the job
              moved up a level: I write the plans and the rules every session
              inherits, I review what comes back, and I draw the lines the
              agents can&apos;t cross.
            </p>
            <p>
              Those lines matter more than the models do. A session in my
              workspace can read every repository, write code, run the suite
              and merge to stage. It can&apos;t read a secret and it can&apos;t
              touch production, even if I tell it to halfway through a session,
              because an instruction is something a model can be talked out of
              and a hook that fails closed isn&apos;t.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-20">
          <Boundary />
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {SETUP.map((item, i) => (
            <Reveal key={item.title} delay={i * 90} className="h-full">
              <div className="h-full bg-background p-6 sm:p-7">
                <p className="font-mono text-[0.65rem] tracking-[0.2em] text-accent/80">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-serif text-xl font-normal">{item.title}</h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
