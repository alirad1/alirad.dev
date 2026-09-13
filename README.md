# alirad.dev

Source for my personal portfolio site.

**Live:** [https://alirad.dev](https://alirad.dev)

Built with [Astro](https://astro.build), Tailwind CSS, and TypeScript.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
npm run preview  # serve the build locally
```

Content lives in `src/data/site.ts`; sections are composed in `src/pages/index.astro`
from small components in `src/components/`. Styling is in `src/styles/`. Static assets
(images, favicon, robots, sitemap) are in `public/`.

## AliBot

The assistant docked in the corner answers questions about my work by retrieving the
site's own content. Its Cloudflare Worker lives in [`alibot/`](alibot/) and has its own
README; the widget is `src/components/AliBot.astro` and `src/scripts/alibot.ts`, and the
write-up is at [alirad.dev/alibot](https://alirad.dev/alibot).

```bash
npm run alibot:corpus   # rebuild the retrieval corpus from src/data/
npm run alibot:dev      # run the worker locally
npm run alibot:deploy
npm run alibot:eval
```
