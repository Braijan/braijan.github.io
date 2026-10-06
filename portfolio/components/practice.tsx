import { Boundary } from "./boundary";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

type Discipline = {
  numeral: string;
  title: string;
  line: string;
  body: string[];
};

const DISCIPLINES: Discipline[] = [
  {
    numeral: "I",
    title: "Define done",
    line: "The specification is the bottleneck now.",
    body: [
      "An agent builds exactly as well as the plan it was handed, so every piece of work starts as a written plan: the goal, the guardrails, what's out of scope, what success looks like, and acceptance criteria that each name the command that proves them.",
      "Before the build starts, a fresh agent that has never seen the conversation attacks the plan, looking for every way it could be built wrong while still passing what's written. Then each check runs against the untouched code, and any criterion that already passes gets thrown out, since it could never have failed. A plan nobody argued with fails in the build.",
    ],
  },
  {
    numeral: "II",
    title: "Lead the team",
    line: "Six agents at once is management work.",
    body: [
      "Each one needs a clear assignment, the context to do it, and a review it can't skip. Reviewers run in parallel, each on its own slice of the change, and every build gets an adversarial review from an agent that didn't write it.",
      "The culture is written down. Commit format, branch names, conventions and the reasons behind them live in instruction files every session inherits and follows without being asked. I ask the agents for very little, and when I do it matters, because a system that prompts for everything trains you to click yes and the prompt that mattered slides through with the rest.",
    ],
  },
  {
    numeral: "III",
    title: "Think like a founder",
    line: "Agents will build whatever you describe.",
    body: [
      "That makes deciding what deserves to exist the scarce skill. Running Cruina and Omniira from an idea to production taught me to start from the person using the thing, to know where the money comes from and what it costs to serve, and to hold a picture of where the product should be a year out so this week's work points at it.",
      "It also leaves room to be creative. Omniira began as an experiment in whether AI characters could hold real memories, and grew a government and an economy because the vision kept getting bigger than the prototype. The human decides and the agents execute, so the deciding has to be good.",
    ],
  },
  {
    numeral: "IV",
    title: "Draw the lines",
    line: "Some rules are culture and some are floor.",
    body: [
      "Culture can bend for a turn when I say so. The floor is code, and no instruction reaches it: a session can work across every repository and ship to stage on its own, and it can't read a secret or touch production even if I tell it to halfway through a session.",
    ],
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
              When agents write the code, engineering becomes leadership.
            </h2>
          </Reveal>

          <Reveal delay={120} className="space-y-5 self-end text-pretty text-lg leading-relaxed text-foreground/80">
            <p>
              Most of the code I ship is written by Claude Code sessions running
              side by side. Writing it stopped being the hard part. What&apos;s hard
              now is knowing what to build, saying it clearly enough that
              it can be checked, running the team that builds it, and deciding
              where that team is allowed to go.
            </p>
            <p>
              Those are the four disciplines I work by, and the reason I built
              Kiryn to watch the fleet while it works.
            </p>
          </Reveal>
        </div>

        <ol className="mt-20">
          {DISCIPLINES.map((d) => (
            <li key={d.title} className="border-t border-border py-14 sm:py-16">
              <Reveal className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
                <div className="flex items-start gap-6">
                  <span
                    className="w-14 shrink-0 pt-2 font-serif text-2xl font-light text-accent italic"
                    aria-hidden="true"
                  >
                    {d.numeral}
                  </span>
                  <div>
                    <h3 className="font-serif text-3xl leading-tight font-light tracking-tight sm:text-4xl">
                      {d.title}
                    </h3>
                    <p className="mt-3 font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
                      {d.line}
                    </p>
                  </div>
                </div>
                <div className="space-y-5 text-pretty text-lg leading-relaxed text-foreground/80">
                  {d.body.map((para) => (
                    <p key={para.slice(0, 32)}>{para}</p>
                  ))}
                </div>
              </Reveal>

              {d.numeral === "IV" ? (
                <Reveal className="mt-16">
                  <Boundary />
                </Reveal>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
