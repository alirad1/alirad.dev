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
