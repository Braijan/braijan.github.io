import { readFileSync } from "node:fs";
import path from "node:path";
import { Marked, type Tokens } from "marked";

export type Paper = {
  slug: string;
  file: string;
  short: string;
  summary: string;
};

export const PAPERS: Paper[] = [
  {
    slug: "cognitive-architecture",
    file: "cognitive-architecture.md",
    short: "A layered cognitive architecture",
    summary:
      "Characters choose what to remember, trust hearsay less than what they saw themselves, pass gossip along with its source attached, let emotion color what they recall and keep a diary. The paper describes these extensions to the standard generative-agent design as they run live.",
  },
  {
    slug: "institutional-agents",
    file: "institutional-agents.md",
    short: "Institutional agents and policy cycles",
    summary:
      "Four LLM ministers and a regent govern a commodity economy. When the treasury drifted toward its floor the ministers raised taxes on their own, and once it recovered they withdrew the proposals.",
  },
  {
    slug: "ontological-routing",
    file: "ontological-routing.md",
    short: "Ontological routing",
    summary:
      "Every input a player types gets a real answer, and the system never speaks as itself. An agent maps what the player typed onto actions compiled from live world state, and when nothing fits, an 8B model narrates the attempt for about $0.000014 a call.",
  },
];

export type Heading = { id: string; text: string };

export type RenderedPaper = Paper & {
  title: string;
  version: string | null;
  html: string;
  headings: Heading[];
  words: number;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "research");

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function stripInline(text: string) {
  return text.replace(/[*_`]/g, "").trim();
}

export function getPaper(slug: string): RenderedPaper | null {
  const paper = PAPERS.find((p) => p.slug === slug);
  if (!paper) return null;

  const source = readFileSync(path.join(CONTENT_DIR, paper.file), "utf8");

  // The first heading is the title; the page renders it separately.
  const titleMatch = source.match(/^# (.+)$/m);
  const title = titleMatch ? stripInline(titleMatch[1]) : paper.short;
  const body = titleMatch ? source.replace(titleMatch[0], "") : source;

  const versionMatch = body.match(/\*\*Draft (v[\d.]+)\.\*\*/);
  const version = versionMatch ? versionMatch[1] : null;

  const headings: Heading[] = [];
  const seen = new Map<string, number>();

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        let id = slugify(text) || `section-${headings.length + 1}`;
        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        if (count) id = `${id}-${count}`;
        if (depth === 2) headings.push({ id, text: stripInline(text) });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      table(token: Tokens.Table) {
        const head = token.header
          .map(
            (cell) =>
              `<th>${this.parser.parseInline(cell.tokens)}</th>`,
          )
          .join("");
        const rows = token.rows
          .map(
            (row) =>
              `<tr>${row
                .map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`)
                .join("")}</tr>`,
          )
          .join("");
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
    },
  });

  const html = marked.parse(body, { async: false });
  const words = source.split(/\s+/).filter(Boolean).length;

  return { ...paper, title, version, html, headings, words };
}

export function getPaperTitles() {
  return PAPERS.map((p) => {
    const rendered = getPaper(p.slug);
    return {
      ...p,
      title: rendered?.title ?? p.short,
      version: rendered?.version ?? null,
      words: rendered?.words ?? 0,
    };
  });
}
