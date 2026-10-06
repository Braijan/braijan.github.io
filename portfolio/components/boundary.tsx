"use client";

import { useState } from "react";
import { FleetField } from "./fleet-field";

type Ring = {
  name: string;
  verdict: string;
  allowed: boolean;
  body: string;
};

// Outermost first. The last ring is the core.
const RINGS: Ring[] = [
  {
    name: "Workspace",
    verdict: "Agents work freely",
    allowed: true,
    body: "Every session opens at the top of the workspace, so one question can be answered across the API, the app and the infrastructure at once. It reads any repo, writes code and runs the suite.",
  },
  {
    name: "Stage",
    verdict: "Agents ship here",
    allowed: true,
    body: "Agents branch, open pull requests and merge to stage. Merged to stage counts as done, and nothing about that step needs me in the loop beyond reading the PR.",
  },
  {
    name: "Secrets",
    verdict: "Never read",
    allowed: false,
    body: "No .env file, no credential directory, no variable file that might hold a key. If a secret ever surfaces in context by accident, the instruction is to treat it as never seen.",
  },
  {
    name: "Production",
    verdict: "Human only",
    allowed: false,
    body: "A hook on every shell command blocks anything aimed at production and fails closed. Permission I grant mid-session doesn't change that. When a task needs prod, the agent hands me the exact command with placeholders and carries on with everything else.",
  },
];

const RADII = [150, 112, 74, 38];

export function Boundary() {
  const [active, setActive] = useState(RINGS.length - 1);
  const ring = RINGS[active];

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
      <div className="mx-auto w-full max-w-[26rem]">
      <div className="relative aspect-square w-full">
        <svg
          viewBox="0 0 320 320"
          className="h-full w-full"
          role="img"
          aria-label="Four nested permission rings. Agents work in the workspace and stage rings. Secrets and production, at the center, are closed to them."
        >
          <defs>
            <radialGradient id="core-glow">
              <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="160" cy="160" r="70" fill="url(#core-glow)" />
          {RINGS.map((r, i) => {
            const isActive = i === active;
            const isCore = i === RINGS.length - 1;
            const color = r.allowed ? "var(--accent)" : "var(--ember)";
            return (
              <g key={r.name}>
                <circle
                  cx="160"
                  cy="160"
                  r={RADII[i]}
                  fill={isCore ? "var(--ember)" : "transparent"}
                  fillOpacity={isCore ? (isActive ? 0.28 : 0.14) : 0}
                  stroke={color}
                  strokeOpacity={isActive ? 0.95 : 0.3}
                  strokeWidth={isActive ? 1.5 : 1}
                  strokeDasharray={r.allowed ? undefined : "3 4"}
                  style={{ transition: "all 0.4s ease" }}
                />
                <text
                  x="160"
                  y={isCore ? 164 : 160 - RADII[i] + 15}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="8.5"
                  letterSpacing="1.6"
                  fill={color}
                  fillOpacity={isActive ? 1 : 0.55}
                  style={{ transition: "fill-opacity 0.4s ease" }}
                >
                  {r.name.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
        <FleetField inner={RADII[2]} outer={RADII[0]} />
      </div>
      </div>

      <div>
        <div role="tablist" aria-label="Permission rings" className="flex flex-wrap gap-2">
          {RINGS.map((r, i) => {
            const isActive = i === active;
            return (
              <button
                key={r.name}
                type="button"
                role="tab"
                id={`ring-tab-${i}`}
                aria-selected={isActive}
                aria-controls="ring-panel"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`rounded-full border px-4 py-2 font-mono text-[0.68rem] tracking-[0.16em] uppercase transition-colors ${
                  isActive
                    ? r.allowed
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-ember/60 bg-ember/10 text-ember"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.name}
              </button>
            );
          })}
        </div>

        <div
          id="ring-panel"
          role="tabpanel"
          aria-labelledby={`ring-tab-${active}`}
          className="mt-6 min-h-[11rem] rounded-2xl border border-border bg-card/60 p-6 sm:p-7"
        >
          <p
            className={`flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.18em] uppercase ${
              ring.allowed ? "text-accent" : "text-ember"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${ring.allowed ? "bg-accent" : "bg-ember"}`}
              aria-hidden="true"
            />
            {ring.verdict}
          </p>
          <p className="mt-4 text-pretty leading-relaxed text-foreground/85">{ring.body}</p>
        </div>
      </div>
    </div>
  );
}
