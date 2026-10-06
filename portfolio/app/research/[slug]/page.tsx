import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPaper, PAPERS } from "@/lib/research";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PAPERS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) return {};
  return {
    title: paper.title,
    description: paper.summary,
    alternates: { canonical: `/research/${paper.slug}` },
    openGraph: {
      type: "article",
      title: paper.title,
      description: paper.summary,
      url: `${SITE.url}/research/${paper.slug}`,
      authors: [SITE.name],
      images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: paper.title,
      description: paper.summary,
      images: ["/og.png"],
    },
  };
}

export default async function PaperPage({ params }: Props) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  const index = PAPERS.findIndex((p) => p.slug === slug);
  const next = PAPERS[(index + 1) % PAPERS.length];
  const [lead, ...rest] = paper.title.split(":");
  const subtitle = rest.join(":").trim();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="relative px-5 pt-32 pb-24 sm:px-8 sm:pt-40">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]"
          style={{
            background:
              "radial-gradient(44rem 26rem at 30% 0%, oklch(0.82 0.06 75 / 8%), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="mx-auto max-w-6xl">
          <Link
            href="/#research"
            className="inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-accent"
          >
            <span aria-hidden="true">←</span> All research
          </Link>

          <header className="reveal mt-10 max-w-4xl">
            <p className="font-mono text-[0.7rem] tracking-[0.2em] text-accent uppercase">
              Paper {index + 1}
              {paper.version ? ` · Working draft ${paper.version}` : null} ·{" "}
              {Math.round(paper.words / 230)} min read
            </p>
            <h1 className="mt-6 text-balance font-serif text-4xl leading-[1.08] font-light tracking-tight sm:text-6xl">
              {subtitle ? (
                <>
                  <span className="text-accent italic">{lead}:</span> {subtitle}
                </>
              ) : (
                paper.title
              )}
            </h1>
          </header>

          <div className="mt-16 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
            <aside className="hidden lg:block">
              <nav
                aria-label="Sections"
                className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto border-l border-border pl-5"
              >
                <p className="font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
                  Contents
                </p>
                <ol className="mt-4 space-y-2.5">
                  {paper.headings.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="block text-[0.8rem] leading-snug text-muted-foreground transition-colors hover:text-accent"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            <article
              className="paper max-w-3xl min-w-0"
              dangerouslySetInnerHTML={{ __html: paper.html }}
            />
          </div>

          <div className="mt-24 border-t border-border pt-10 lg:ml-[18rem]">
            <p className="font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
              Next paper
            </p>
            <Link
              href={`/research/${next.slug}`}
              className="group mt-4 inline-flex items-baseline gap-3 font-serif text-2xl font-normal text-foreground transition-colors hover:text-accent sm:text-3xl"
            >
              {next.short}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
