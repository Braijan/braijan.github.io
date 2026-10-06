export const SITE = {
  name: "Brian Charles Smith",
  url: "https://briancharlessmith.com",
  description:
    "Software engineer who designs agentic systems that ship, and the guardrails that let a company trust them. Founder of The Smith Syndicate.",
  linkedin: "https://www.linkedin.com/in/brian-smith-a36b6059/",
  github: "https://github.com/Braijan",
  syndicate: "https://thesmithsyndicate.com",
} as const;

export const NAV = [
  { label: "Practice", href: "/#practice" },
  { label: "Work", href: "/#work" },
  { label: "Research", href: "/#research" },
  { label: "Path", href: "/#path" },
  { label: "Contact", href: "/#contact" },
] as const;

export type Project = {
  index: string;
  name: string;
  tagline: string;
  role: string;
  status: string;
  live: boolean;
  href: string;
  linkLabel: string;
  logo?: { src: string; width: number; height: number };
  body: string[];
  facts: { value: string; label: string }[];
};

export const PROJECTS: Project[] = [
  {
    index: "01",
    name: "Cruina",
    tagline: "Private family reunion and event planning",
    role: "Co-founder, engineering",
    status: "Live",
    live: true,
    href: "https://cruina.com",
    linkLabel: "cruina.com",
    logo: { src: "/images/cruina-logo.png", width: 1200, height: 340 },
    body: [
      "A private home where a family organizes reunions, keeps a member directory and a family tree, takes registrations and collects money. Payments go straight to whoever is running the event through Stripe Connect, so nothing sits in escrow and any member can be the one collecting.",
      "It's a multi-tenant SaaS, and the whole product rests on one invariant: every query against a tenant table takes the tenant from the verified session and never from the request. The API is Hono and TypeScript on Cloud Run, the infrastructure is Terraform on GCP, and a single Expo codebase serves iOS, Android and the web.",
    ],
    facts: [
      { value: "181", label: "API operations" },
      { value: "1", label: "codebase for iOS, Android and web" },
      { value: "0", label: "ways to join a family without an invite" },
    ],
  },
  {
    index: "02",
    name: "Omniira",
    tagline: "A persistent world run by autonomous AI characters",
    role: "Creator",
    status: "Live",
    live: true,
    href: "https://omniira.ai",
    linkLabel: "omniira.ai",
    logo: { src: "/images/omniira-white-logo.png", width: 595, height: 90 },
    body: [
      "Omniira is an ARC, my name for an autonomous realm: a multiplayer fantasy world where the people you meet are language-model agents who remember you, decide for themselves what's worth remembering, pass gossip along with a record of who said it, and write a diary entry at the end of every game day.",
      "Above them sits a government. Four LLM ministers read the live economy and propose tax changes and warehouse releases, and a regent enacts at most one decree per cycle. Inference is split across three model tiers behind a decision queue, so the cheap calls stay cheap and the expensive ones are rationed.",
    ],
    facts: [
      { value: "29", label: "named characters with memory" },
      { value: "3", label: "model tiers behind one queue" },
      { value: "175", label: "game days of logged behavior" },
    ],
  },
  {
    index: "03",
    name: "Kiryn",
    tagline: "A console for running a fleet of Claude Code sessions",
    role: "Creator",
    status: "Coming soon",
    live: false,
    href: "https://kiryn.dev",
    linkLabel: "kiryn.dev",
    body: [
      "Once you run six agent sessions at once, the hard part is knowing which one is stuck waiting on you. Kiryn reads Claude Code's own transcripts and shows every session on the machine: its repo and branch, the tool it's running, how full its context is, and whether it needs an answer.",
      "You drive it by voice. A latch decides where your words go and a voiceprint refuses anyone else in the room. Kiryn opens terminals and carries keystrokes between them. It never writes code itself and holds exactly one credential. It's headed for open source.",
    ],
    facts: [
      { value: "1", label: "credential, and it can prove it" },
      { value: "0", label: "lines of code it writes itself" },
    ],
  },
];

export type Station = {
  year: string;
  title: string;
  place: string;
  body: string;
  now?: boolean;
};

export const PATH: Station[] = [
  {
    year: "2008",
    title: "Culinary school, then the line",
    place: "Johnson & Wales University · Philadelphia",
    body: "BS in Culinary Nutrition, magna cum laude. Worked up to sous chef in the Greater Philadelphia area.",
  },
  {
    year: "2014",
    title: "Philadelphia Police Department",
    place: "Philadelphia, PA",
    body: "Police officer for eight years, promoted to sergeant in 2022.",
  },
  {
    year: "2023",
    title: "Co-owner and executive chef",
    place: "Dawghouse Grille · Elmer, NJ",
    body: "Left the department to help start a food truck and a brewery and cidery in South Jersey.",
  },
  {
    year: "2024",
    title: "Software engineer",
    place: "Self-taught",
    body: "Built my first site by hand from a YouTube tutorial. This page replaced it.",
  },
  {
    year: "2025",
    title: "Co-founded The Smith Syndicate",
    place: "With my brother Josh",
    body: "An independent studio for privacy-conscious software. Cruina and Omniira are ours.",
  },
  {
    year: "Now",
    title: "Security Product Engineer",
    place: "Enigma Networks",
    body: "Building security products by day, and agent-built ventures the rest of the time.",
    now: true,
  },
];
