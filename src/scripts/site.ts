/* ============================================================================
   alirad.dev — behaviour
   Theme, scroll position, project filters, and the Moments filmstrip.
   Bundled by Astro; the pre-paint theme set lives inline in the layout head.
   ========================================================================== */

type Theme = 'dark' | 'light';
type FilterKey = 'live' | 'webdev' | 'aws' | 'python' | 'java' | 'award' | 'sql';
type Matcher = (card: HTMLElement, tags: string[]) => boolean;

const THEME_COLOR: Record<Theme, string> = { dark: '#0F0D0E', light: '#FAF9F7' };

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function prefersReducedMotion(): boolean {
  return motionQuery.matches;
}

/* ── Theme ─────────────────────────────────────────────────────────────── */

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function setupTheme(): void {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  function syncLabel(): void {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    toggle!.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  syncLabel();

  toggle.addEventListener('click', () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    if (meta) meta.content = THEME_COLOR[next];
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* Private mode — the theme still applies for this visit. */
    }
    syncLabel();
  });
}

/* ── Scroll position: rail, topbar, progress ───────────────────────────── */

function setupScrollState(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.topbar-nav a[data-nav]'))
    .map((link) => document.getElementById(link.dataset.nav ?? ''))
    .filter((el): el is HTMLElement => el !== null);

  const railMarks = document.querySelectorAll<HTMLElement>('.rail-mark');
  const navLinks = document.querySelectorAll<HTMLElement>('.topbar-nav a');
  const railProgress = document.getElementById('railProgress');
  const topbarProgress = document.getElementById('topbarProgress');
  let ticking = false;

  function markActive(id: string): void {
    railMarks.forEach((mark) => mark.classList.toggle('is-active', mark.dataset.rail === id));
    navLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.nav === id));
  }

  function update(): void {
    ticking = false;

    const scrolled = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? Math.min(1, Math.max(0, scrolled / scrollable)) : 0;

    if (railProgress) railProgress.style.height = (pct * 100).toFixed(2) + '%';
    if (topbarProgress) topbarProgress.style.width = (pct * 100).toFixed(2) + '%';

    // The section that owns the upper third of the viewport wins.
    const marker = scrolled + window.innerHeight * 0.32;
    let active = '';

    for (const section of sections) {
      if (section.offsetTop <= marker) active = section.id;
    }

    // Always light up the last section once the page bottoms out.
    if (pct > 0.985 && sections.length) active = sections[sections.length - 1].id;

    markActive(active);
  }

  function onScroll(): void {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ── In-page links ──────────────────────────────────────────────────────
   The home page is one page, so its links scroll instead of navigating.
   Handling them here keeps "#projects" and friends out of the address bar. */

function scrollToId(id: string): boolean {
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';

  if (id === 'top') {
    window.scrollTo({ top: 0, behavior });
    return true;
  }

  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior, block: 'start' });
  return true;
}

function setupInPageLinks(): void {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href')!.slice(1);
    if (!id || !scrollToId(id)) return;
    e.preventDefault();

    // Keyboard users following the skip link expect focus to move with them.
    if (link.classList.contains('skip-link')) {
      const target = document.getElementById(id);
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });

  // Arriving from another page with a hash (or an old #work link): land on
  // the section, then drop the hash from the address bar.
  const hash = window.location.hash.slice(1);
  if (hash) {
    const id = hash === 'work' ? 'projects' : hash;
    if (document.getElementById(id)) {
      if (id !== hash) scrollToId(id);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
}

/* ── Project filters ───────────────────────────────────────────────────── */

function setupFilters(): void {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll<HTMLElement>('.card'));
  const pills = document.querySelectorAll<HTMLElement>('.pill');
  const empty = document.getElementById('projectsEmpty');

  const anyOf = (list: string[]) => (_card: HTMLElement, tags: string[]) =>
    tags.some((t) => list.includes(t));

  // Keys match the data-filter attributes; values read the card's data-tags.
  const MATCHERS: Record<FilterKey, Matcher> = {
    live: (card) => card.dataset.live === 'true',
    webdev: anyOf(['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Astro', 'Next.js', 'React', 'Tailwind CSS']),
    aws: anyOf(['AWS']),
    python: anyOf(['Python', 'Flask', 'Streamlit', 'REST API']),
    java: anyOf(['Java', 'LWJGL', 'ImGui']),
    award: anyOf(['Award Winner']),
    sql: anyOf(['MySQL', 'PostgreSQL']),
  };

  let active = 'all';

  function matches(card: HTMLElement): boolean {
    if (active === 'all') return true;
    const tags = (card.dataset.tags || '').split(',').map((t) => t.trim());
    const matcher = MATCHERS[active as FilterKey];
    return matcher ? matcher(card, tags) : false;
  }

  function render(): void {
    let visible = 0;

    for (const card of cards) {
      const show = matches(card);
      card.classList.toggle('card-hidden', !show);
      if (show) {
        visible++;
        card.classList.add('is-visible');
      }
    }

    if (empty) empty.hidden = visible > 0;
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      let filter = pill.dataset.filter || 'all';

      // Clicking the active pill clears back to All.
      if (pill.classList.contains('active') && filter !== 'all') {
        filter = 'all';
      }

      pills.forEach((p) => p.classList.toggle('active', p.dataset.filter === filter));

      active = filter;
      render();
    });
  });

  render();
}

/* ── Moments filmstrip ─────────────────────────────────────────────────── */

function setupStrip(): void {
  const strip = document.getElementById('strip');
  if (!strip) return;

  const frames = Array.from(strip.querySelectorAll<HTMLElement>('.frame'));
  const prev = document.getElementById('stripPrev') as HTMLButtonElement | null;
  const next = document.getElementById('stripNext') as HTMLButtonElement | null;
  const counter = document.getElementById('stripCounter');
  const total = frames.length;
  let ticking = false;
  let pagingTimer: number | null = null;

  function pad(n: number): string {
    return (n < 10 ? '0' : '') + n;
  }

  function maxScroll(): number {
    return Math.max(0, strip!.scrollWidth - strip!.clientWidth);
  }

  // The scrollLeft at which each frame sits flush against the left edge.
  // Measured from live rects so it stays correct after resize or font swap.
  function stops(): number[] {
    const stripLeft = strip!.getBoundingClientRect().left;
    const inset = parseFloat(getComputedStyle(strip!).scrollPaddingLeft) || 0;
    const base = strip!.scrollLeft - stripLeft - inset;
    const end = maxScroll();

    return frames.map((frame) => {
      const pos = frame.getBoundingClientRect().left + base;
      return Math.max(0, Math.min(Math.round(pos), end));
    });
  }

  function update(): void {
    ticking = false;

    const left = strip!.scrollLeft;
    const end = maxScroll();
    const positions = stops();

    // Report the leftmost frame that is flush with, or past, the edge.
    let index = 0;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] <= left + 4) index = i;
    }
    if (end > 0 && left >= end - 2) index = total - 1;

    if (counter) counter.textContent = pad(index + 1) + ' / ' + pad(total);
    if (prev) prev.disabled = left <= 2;
    if (next) next.disabled = end <= 0 || left >= end - 2;
  }

  function onScroll(): void {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  // Advance by roughly one viewport, but always land flush on a frame.
  function targetFor(direction: 1 | -1): number {
    const positions = stops();
    const cur = strip!.scrollLeft;
    const reach = strip!.clientWidth + 4;

    if (direction > 0) {
      let forward: number | null = null;
      for (const pos of positions) {
        if (pos > cur + 4 && pos <= cur + reach) forward = pos;
      }
      if (forward === null) {
        for (const pos of positions) {
          if (pos > cur + 4) { forward = pos; break; }
        }
      }
      return forward === null ? maxScroll() : forward;
    }

    for (const pos of positions) {
      if (pos < cur - 4 && pos >= cur - reach) return pos;
    }
    let back = 0;
    for (const pos of positions) {
      if (pos < cur - 4) back = pos;
    }
    return back;
  }

  // scrollTo({behavior:'smooth'}) is unreliable inside a snap container —
  // the snap engine cancels it, and some browsers no-op it entirely.
  // Tweening scrollLeft ourselves works the same way everywhere.
  function stopAnimation(): void {
    if (pagingTimer !== null) {
      window.cancelAnimationFrame(pagingTimer);
      pagingTimer = null;
      strip!.classList.remove('is-paging');
    }
  }

  function animateTo(target: number): void {
    stopAnimation();

    const start = strip!.scrollLeft;
    const delta = target - start;
    if (Math.abs(delta) < 1) return;

    if (prefersReducedMotion()) {
      strip!.scrollLeft = target;
      update();
      return;
    }

    const duration = 420;
    let began: number | null = null;

    strip!.classList.add('is-paging');

    pagingTimer = window.requestAnimationFrame(function step(now: number) {
      if (began === null) began = now;

      const progress = Math.min(1, (now - began) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      strip!.scrollLeft = start + delta * eased;

      if (progress < 1) {
        pagingTimer = window.requestAnimationFrame(step);
        return;
      }

      pagingTimer = null;
      strip!.classList.remove('is-paging');
      update();
    });
  }

  function page(direction: 1 | -1): void {
    animateTo(targetFor(direction));
  }

  if (prev) prev.addEventListener('click', () => page(-1));
  if (next) next.addEventListener('click', () => page(1));

  strip.addEventListener('scroll', onScroll, { passive: true });

  strip.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      page(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      page(-1);
    }
  });

  // Drag to pan, with a small threshold so clicks still land on links.
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;

  // Any manual input takes over from an in-flight button scroll.
  strip.addEventListener('wheel', stopAnimation, { passive: true });
  strip.addEventListener('touchstart', stopAnimation, { passive: true });

  strip.addEventListener('pointerdown', (e: PointerEvent) => {
    stopAnimation();
    if (e.pointerType === 'touch') return; // native touch scrolling is better
    dragging = true;
    moved = false;
    startX = e.clientX;
    startLeft = strip!.scrollLeft;
  });

  strip.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) {
      moved = true;
      strip!.classList.add('is-dragging');
      try { strip!.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (moved) strip!.scrollLeft = startLeft - dx;
  });

  function endDrag(): void {
    dragging = false;
    moved = false;
    strip!.classList.remove('is-dragging');
  }

  strip.addEventListener('pointerup', endDrag);
  strip.addEventListener('pointercancel', endDrag);
  strip.addEventListener('pointerleave', endDrag);

  window.addEventListener('resize', onScroll, { passive: true });

  // Frame widths depend on loaded images only for the scroll extent,
  // so recheck the button states once everything settles.
  window.addEventListener('load', update);
  update();
}

/* ── Boot ──────────────────────────────────────────────────────────────── */

function init(): void {
  setupTheme();
  setupInPageLinks();
  setupScrollState();
  setupFilters();
  setupStrip();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
