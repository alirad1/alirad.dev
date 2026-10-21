/* Builds the AliBot retrieval corpus from the site's own content.
   Run with `npm run corpus` (from alibot/) or `npm run alibot:corpus` (root).

   Sources: src/data/site.ts (projects, experience, moments, hero, contact),
   src/data/alibot.ts (the AliBot write-up), and the README of every project
   repository. Output: alibot/src/corpus.json, which is committed and bundled
   into the Worker. */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { projects, research, experience, involvement, moments, chunkId } from '../../src/data/site.ts';
import { alibotSections } from '../../src/data/alibot.ts';
import type { Chunk, ChunkKind, Corpus } from '../src/corpus.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../src/corpus.json');

const SITE = 'https://alirad.dev';
const MAX_CHARS = 1500;
const MIN_CHARS = 80;

/* ── Text helpers ──────────────────────────────────────────────────────── */

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
};

/** Strips the inline <strong> emphasis the site renders and decodes entities. */
function plain(html: string): string {
  let out = html.replace(/<[^>]+>/g, '');
  for (const [entity, char] of Object.entries(ENTITIES)) {
    out = out.split(entity).join(char);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function clamp(text: string, max = MAX_CHARS): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = cut.lastIndexOf('. ');
  return (stop > max * 0.6 ? cut.slice(0, stop + 1) : cut).trim();
}

function add(list: Chunk[], chunk: Chunk): void {
  if (chunk.text.length < MIN_CHARS) {
    console.warn(`  skipped ${chunk.id} (only ${chunk.text.length} chars)`);
    return;
  }
  list.push({ ...chunk, text: clamp(chunk.text) });
}

/* ── Site chunks ───────────────────────────────────────────────────────── */

function siteChunks(): Chunk[] {
  const out: Chunk[] = [];

  add(out, {
    id: 'about',
    kind: 'about',
    title: 'About Ali Rad',
    url: `${SITE}/`,
    onPage: true,
    text: plain(
      'Ali Rad is a Computer Engineering student at Texas A&M University in College Station, Texas. ' +
        'He builds desktop and web tools that people actually run: a time-lapse recorder for study sessions, ' +
        'a wallpaper that redraws itself every morning, and a habit tracker that argues back. ' +
        'He builds desktop apps, web apps and games, and works in Java, C++, Python, JavaScript and SQL. ' +
        'He is currently seeking summer internships.',
    ),
  });

  for (const p of projects) {
    const links = p.links.map((l) => `${l.label}: ${l.href}`).join(', ');
    add(out, {
      id: chunkId('proj', p.slug),
      kind: 'project',
      title: p.title,
      url: `${SITE}/#projects`,
      onPage: true,
      text: plain(
        `${p.title}${p.titleSub ? ` (${p.titleSub})` : ''} is a project by Ali Rad. ` +
          `Status: ${p.state.label}. ${p.desc} Stack: ${p.stack}. ` +
          `Tags: ${p.tags.split(',').join(', ')}. Links: ${links}.`,
      ),
    });
  }

  for (const [group, entries] of [
    ['research and work', [...research, ...experience]],
    ['clubs and organizations', involvement],
  ] as const) {
    for (const e of entries) {
      add(out, {
        id: chunkId('exp', e.slug),
        kind: 'experience',
        title: `${plain(e.org)} — ${e.role}`,
        url: `${SITE}/#experience`,
        onPage: true,
        // Naming Ali matters: a cross-encoder scoring "where does Ali do
        // research" against a chunk that never mentions him will lose to one
        // that does, however relevant the subject matter.
        text: plain(
          `Ali Rad — ${e.role} at ${e.org}, ${e.when}, ${e.where}. ` +
            `This is part of Ali's ${group} experience. ${e.desc} ` +
            `Topics: ${e.tags.join(', ')}.${e.link ? ` More: ${e.link.href}.` : ''}`,
        ),
      });
    }
  }

  for (const m of moments) {
    add(out, {
      id: chunkId('moment', m.num),
      kind: 'moment',
      title: `Moment ${m.num}: ${m.label}`,
      url: `${SITE}/#moments`,
      onPage: true,
      text: plain(
        `A photo of Ali Rad, captioned "${m.label}". ${m.cap} ` +
          'This is one of the moments Ali keeps on his site.',
      ),
    });
  }

  add(out, {
    id: 'contact',
    kind: 'contact',
    title: 'Contact Ali',
    url: `${SITE}/#contact`,
    onPage: true,
    text:
      'Ali answers every email, about a role, a project on the site, or something you are building. ' +
      'Email: alizrad99@gmail.com. GitHub: github.com/alirad1. LinkedIn: linkedin.com/in/alirad07. ' +
      'Location: College Station, Texas. He is open to summer 2026 internships.',
  });

  for (const s of alibotSections) {
    add(out, {
      id: `alibot-${s.id}`,
      kind: 'alibot',
      title: `AliBot — ${s.title}`,
      url: `${SITE}/alibot`,
      onPage: false,
      text: plain(s.body),
    });
  }

  return out;
}

/* ── README chunks ─────────────────────────────────────────────────────── */

const README_NAMES = ['README.md', 'readme.md', 'README.MD'];

async function fetchReadme(repo: string): Promise<string | null> {
  for (const name of README_NAMES) {
    const url = `https://raw.githubusercontent.com/${repo}/HEAD/${name}`;
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
    } catch (err) {
      console.warn(`  ${repo}: ${String(err)}`);
    }
  }
  return null;
}

/** Markdown to plain prose: drops badges, images, links-as-markup and long code. */
function cleanMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (block) => (block.split('\n').length > 10 ? '' : block.replace(/```/g, '')))
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^[ \t]*[-*=]{3,}[ \t]*$/gm, '')
    .replace(/[*_`>|]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Splits on headings, then on blank lines when a section is still too long. */
function splitReadme(md: string): { heading: string; body: string }[] {
  const out: { heading: string; body: string }[] = [];
  const sections = md.split(/^#{1,6}\s+/m);

  for (const [i, section] of sections.entries()) {
    const lines = section.split('\n');
    const heading = i === 0 ? 'Overview' : (lines.shift() ?? '').trim();
    const body = lines.join('\n').trim();
    if (!body) continue;

    if (body.length <= MAX_CHARS) {
      out.push({ heading, body });
      continue;
    }

    let buffer = '';
    for (const para of body.split(/\n\s*\n/)) {
      if (buffer && buffer.length + para.length > MAX_CHARS) {
        out.push({ heading, body: buffer.trim() });
        buffer = '';
      }
      buffer += para + '\n\n';
    }
    if (buffer.trim()) out.push({ heading, body: buffer.trim() });
  }

  return out;
}

async function readmeChunks(): Promise<Chunk[]> {
  const out: Chunk[] = [];
  const fetched = new Set<string>();

  for (const p of projects) {
    // Two cards can share a repository; its README is worth ingesting once.
    if (!p.repo || fetched.has(p.repo)) continue;
    fetched.add(p.repo);

    const raw = await fetchReadme(p.repo);
    if (!raw) {
      console.warn(`  no README found for ${p.repo}`);
      continue;
    }

    const sections = splitReadme(cleanMarkdown(raw));
    let n = 0;
    for (const { heading, body } of sections) {
      const text = plain(`${p.title} README — ${heading}. ${body}`);
      if (text.length < MIN_CHARS) continue;
      n += 1;
      out.push({
        id: `readme-${p.slug}-${n}`,
        kind: 'readme' satisfies ChunkKind,
        title: `${p.title} README: ${heading}`,
        text: clamp(text),
        url: `https://github.com/${p.repo}#readme`,
        onPage: false,
      });
    }
    console.log(`  ${p.repo}: ${n} chunk(s)`);
  }

  return out;
}

/* ── Main ──────────────────────────────────────────────────────────────── */

const site = siteChunks();
console.log(`site: ${site.length} chunk(s)`);
console.log('readmes:');
const readmes = await readmeChunks();

const chunks = [...site, ...readmes];

const seen = new Set<string>();
for (const c of chunks) {
  if (seen.has(c.id)) throw new Error(`duplicate chunk id: ${c.id}`);
  seen.add(c.id);
}

const corpus: Corpus = { builtAt: new Date().toISOString(), chunks };
writeFileSync(OUT, JSON.stringify(corpus, null, 2) + '\n', 'utf8');

const byKind = new Map<string, number>();
for (const c of chunks) byKind.set(c.kind, (byKind.get(c.kind) ?? 0) + 1);

console.log(`\nwrote ${chunks.length} chunks to src/corpus.json`);
for (const [kind, count] of [...byKind].sort()) console.log(`  ${kind.padEnd(11)} ${count}`);
const words = chunks.reduce((sum, c) => sum + c.text.split(' ').length, 0);
console.log(`  ~${Math.round(words / 0.75 / 1000)}k tokens total`);
