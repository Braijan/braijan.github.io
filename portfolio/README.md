# briancharlessmith.com

Personal site. Next.js 15 (App Router), Tailwind 4, deployed on Vercel from this `portfolio/` directory.

```bash
nvm use
npm install
npm run dev
```

- Content for the home page lives in `lib/site.ts`.
- The research papers are Markdown in `content/research/`, rendered at build time by `lib/research.ts`. To add one, drop the file there and add an entry to `PAPERS`.
