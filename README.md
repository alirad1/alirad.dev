# alirad.dev

The source for my personal portfolio. It is a static [Astro](https://astro.build) site
built with Tailwind CSS and TypeScript, and it is where I keep my projects, my experience,
and whatever I happen to be building at the moment.

**Live:** [https://alirad.dev](https://alirad.dev)

## How it fits together

All of the content lives as data in `src/data/site.ts`. The page in `src/pages/index.astro`
maps over those arrays and renders them through small components in `src/components/`, so
adding a project or an experience entry is an edit to one file rather than a block of markup
to copy out by hand. Styling is written by hand in `src/styles/`, and everything static (the
images, the favicon, robots, sitemap) sits in `public/`.

Keeping the content apart from the presentation like this is really the whole idea. The site
reads as one measured page, and the parts that repeat are described once and reused.

## AliBot

The assistant docked in the corner answers questions about my work by retrieving the site's
own content rather than making anything up. The Cloudflare Worker behind it lives in
[`alibot/`](alibot/) and has its own README that walks through the retrieval and generation
logic. The widget you see on the page is `src/components/AliBot.astro` together with
`src/scripts/alibot.ts`.
