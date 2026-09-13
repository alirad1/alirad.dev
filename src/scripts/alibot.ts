/* ============================================================================
   AliBot — the widget.

   Talks to the Cloudflare Worker in alibot/ over server-sent events and renders
   the result. Model output is only ever written as text nodes, never as HTML,
   so nothing the model produces can execute here.
   ========================================================================== */

type Source = {
  n: number;
  id: string;
  title: string;
  url: string;
  onPage: boolean;
  score: number;
  text?: string;
};

type Meta = {
  model: string | null;
  gated: boolean;
  gate: number;
  degraded: string;
  sources: Source[];
  timings: Record<string, number>;
};

type Done = {
  citations: number[];
  fallback: boolean;
  gated: boolean;
  timings: Record<string, number>;
  tokens: { in: number; out: number };
  neurons: number;
  costUsd: number;
};

type Turn = { role: 'user' | 'assistant'; content: string };

const MAX_MESSAGE = 500;
const MAX_HISTORY = 6;
const HIGHLIGHT_MS = 1600;
const STORE_KEY = 'alibot-transcript';

const launcher = document.getElementById('botLauncher') as HTMLButtonElement | null;
const panel = document.getElementById('botPanel');
const log = document.getElementById('botLog');
const intro = document.getElementById('botIntro');
const form = document.getElementById('botForm') as HTMLFormElement | null;
const input = document.getElementById('botInput') as HTMLTextAreaElement | null;
const send = document.getElementById('botSend') as HTMLButtonElement | null;
const count = document.getElementById('botCount');
const statusEl = document.getElementById('botStatus');
const announce = document.getElementById('botAnnounce');
const closeBtn = document.getElementById('botClose');
const dots = [document.getElementById('botDot'), document.getElementById('botHeadDot')];

if (launcher && panel && log && form && input && send) {
  const endpoint = (launcher.dataset.endpoint ?? '').replace(/\/$/, '');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let history: Turn[] = [];
  let streaming = false;
  let online: boolean | null = null;
  let controller: AbortController | null = null;
  let highlighted: { el: Element; timer: number } | null = null;

  /* ── Small helpers ───────────────────────────────────────────────────── */

  const el = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    text?: string,
  ): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function setDots(state: 'ready' | 'busy' | 'idle'): void {
    for (const dot of dots) {
      if (!dot) continue;
      dot.classList.toggle('bot-dot-idle', state === 'idle');
      dot.classList.toggle('bot-dot-busy', state === 'busy');
    }
  }

  function setStatus(text: string): void {
    if (statusEl) statusEl.textContent = text;
  }

  function scrollLog(): void {
    log!.scrollTop = log!.scrollHeight;
  }

  function ms(n: number | undefined): string {
    return typeof n === 'number' ? `${Math.round(n)} ms` : '—';
  }

  /* ── Transcript persistence (this tab only) ──────────────────────────── */

  function save(): void {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    } catch {
      /* Private mode: the transcript simply does not survive a reload. */
    }
  }

  function restore(): void {
    let saved: Turn[] = [];
    try {
      saved = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? '[]') as Turn[];
    } catch {
      saved = [];
    }
    if (!Array.isArray(saved) || saved.length === 0) return;

    for (const turn of saved) {
      if (turn.role === 'user') addAsk(turn.content);
      else {
        const { text } = addAnswer();
        text.textContent = turn.content;
      }
    }
    history = saved.slice(-MAX_HISTORY);
    intro?.remove();
  }

  /* ── Rendering ───────────────────────────────────────────────────────── */

  function addAsk(text: string): void {
    const node = el('div', 'bot-ask', text);
    log!.append(node);
    scrollLog();
  }

  function addAnswer(): { wrap: HTMLElement; text: HTMLElement } {
    const wrap = el('div', 'bot-answer');
    const text = el('p', 'bot-answer-text bot-caret');
    wrap.append(text);
    log!.append(wrap);
    scrollLog();
    return { wrap, text };
  }

  function addNote(message: string, className = 'bot-answer-note'): void {
    const wrap = el('div', 'bot-answer');
    wrap.append(el('p', className, message));
    log!.append(wrap);
    scrollLog();
  }

  /** Sends the reader to the element a citation came from. */
  function jumpTo(source: Source): void {
    const target = source.onPage
      ? document.querySelector(`[data-chunk="${CSS.escape(source.id)}"]`)
      : null;

    if (!target) {
      window.open(source.url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (highlighted) {
      highlighted.el.classList.remove('chunk-hit');
      window.clearTimeout(highlighted.timer);
    }

    if (window.matchMedia('(max-width: 640px)').matches) closePanel();

    target.scrollIntoView({
      block: 'center',
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
    target.classList.add('chunk-hit');

    const timer = window.setTimeout(() => {
      target.classList.remove('chunk-hit');
      highlighted = null;
    }, HIGHLIGHT_MS);

    highlighted = { el: target, timer };
  }

  function addCitations(wrap: HTMLElement, sources: Source[], used: number[]): void {
    const cited = used.length > 0 ? sources.filter((s) => used.includes(s.n)) : sources.slice(0, 2);
    if (cited.length === 0) return;

    const row = el('div', 'bot-cites');
    for (const source of cited) {
      const chip = el('button', 'bot-cite');
      chip.type = 'button';
      chip.append(el('span', 'bot-cite-n', String(source.n)));
      chip.append(el('span', 'bot-cite-title', source.title));
      chip.title = source.onPage ? `Show "${source.title}" on the page` : `Open ${source.url}`;
      chip.addEventListener('click', () => jumpTo(source));
      row.append(chip);
    }
    wrap.append(row);
  }

  function specRow(key: string, value: string | HTMLElement): HTMLElement {
    const row = el('div', 'spec-row');
    row.append(el('dt', 'spec-key', key));
    const dd = el('dd', 'spec-val');
    if (typeof value === 'string') dd.textContent = value;
    else dd.append(value);
    row.append(dd);
    return row;
  }

  /** The observability readout: what was retrieved, how long it took, what it cost. */
  function addDetails(wrap: HTMLElement, meta: Meta, done: Done): void {
    const details = el('details', 'bot-details');
    details.append(el('summary', undefined, 'Details'));

    const dl = el('dl', 'bot-spec');
    dl.append(specRow('Model', meta.gated ? 'not called (below gate)' : (meta.model ?? '—')));

    const sources = el('span');
    for (const source of meta.sources) {
      sources.append(
        el('span', 'bot-source-line', `[${source.n}] ${source.title} · ${source.score.toFixed(3)}`),
      );
    }
    dl.append(specRow('Retrieved', meta.sources.length ? sources : 'nothing'));

    dl.append(
      specRow(
        'Latency',
        `embed ${ms(done.timings.embed)} · search ${ms(done.timings.vector)} · ` +
          `rerank ${ms(done.timings.rerank)} · first token ${ms(done.timings.firstToken)} · ` +
          `total ${ms(done.timings.total)}`,
      ),
    );
    dl.append(specRow('Tokens', `${done.tokens.in} in · ${done.tokens.out} out`));
    dl.append(
      specRow('Cost', `${done.neurons.toFixed(2)} neurons · $${done.costUsd.toFixed(6)} at paid rate`),
    );

    details.append(dl);
    wrap.append(details);
  }

  /* ── Networking ──────────────────────────────────────────────────────── */

  async function checkHealth(): Promise<void> {
    if (online !== null || !endpoint) return;
    try {
      const res = await fetch(`${endpoint}/health`, { method: 'GET' });
      online = res.ok;
    } catch {
      online = false;
    }
    setDots(online ? 'ready' : 'idle');
    if (!online) setStatus('offline');
  }

  async function ask(question: string): Promise<void> {
    if (streaming) return;
    streaming = true;
    send!.disabled = true;
    setDots('busy');
    setStatus('thinking');
    intro?.remove();

    addAsk(question);
    history.push({ role: 'user', content: question });

    const { wrap, text } = addAnswer();
    let meta: Meta | null = null;
    let answer = '';
    let fellBack = false;

    controller = new AbortController();

    try {
      const res = await fetch(`${endpoint}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: question, history: history.slice(-MAX_HISTORY - 1, -1) }),
        signal: controller.signal,
      });

      if (res.status === 429) throw new Error('rate_limited');
      if (!res.ok || !res.body) throw new Error(`http_${res.status}`);

      online = true;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          let event = 'message';
          let data = '';
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
          }
          if (!data) continue;

          let payload: unknown;
          try {
            payload = JSON.parse(data);
          } catch {
            continue;
          }

          if (event === 'meta') {
            meta = payload as Meta;
          } else if (event === 'token') {
            answer += (payload as { t: string }).t;
            text.textContent = answer;
            scrollLog();
          } else if (event === 'fallback') {
            fellBack = true;
            const fb = payload as { sources: Source[] };
            text.classList.remove('bot-caret');
            text.textContent =
              "AliBot's free quota is used up for today. Here is what the site says:";
            for (const source of fb.sources) {
              const quote = el('p', 'bot-quote', source.text ?? '');
              wrap.append(quote);
            }
            addCitations(wrap, fb.sources, []);
          } else if (event === 'done') {
            const doneData = payload as Done;
            text.classList.remove('bot-caret');
            if (meta) {
              if (!fellBack) addCitations(wrap, meta.sources, doneData.citations);
              addDetails(wrap, meta, doneData);
            }
            if (answer) {
              history.push({ role: 'assistant', content: answer });
              history = history.slice(-MAX_HISTORY);
              save();
              if (announce) announce.textContent = answer;
            }
            scrollLog();
          } else if (event === 'error') {
            throw new Error((payload as { code?: string }).code ?? 'internal');
          }
        }
      }
    } catch (err) {
      text.classList.remove('bot-caret');
      const reason = err instanceof Error ? err.message : 'internal';

      if (!answer) {
        // Drop the empty answer block entirely, not just its text node.
        wrap.remove();
        if (reason === 'rate_limited') {
          addNote('That is a lot of questions at once. Try again in a minute.', 'bot-error');
        } else if (reason === 'AbortError') {
          addNote('Stopped.');
        } else {
          online = false;
          addNote(
            'AliBot is offline right now. Everything else on the page still works, and Ali reads email at alizrad99@gmail.com.',
            'bot-error',
          );
        }
      }
    } finally {
      streaming = false;
      controller = null;
      send!.disabled = input!.value.trim().length === 0;
      setDots(online === false ? 'idle' : 'ready');
      setStatus(online === false ? 'offline' : 'answers from this site only');
      scrollLog();
    }
  }

  /* ── Open and close ──────────────────────────────────────────────────── */

  function openPanel(): void {
    panel!.hidden = false;
    panel!.classList.add('bot-panel-enter');
    // Two frames: the browser must paint the entry state before it transitions.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => panel!.classList.remove('bot-panel-enter')),
    );
    launcher!.setAttribute('aria-expanded', 'true');
    launcher!.hidden = true;
    input!.focus();
    void checkHealth();
  }

  function closePanel(): void {
    controller?.abort();
    panel!.hidden = true;
    launcher!.hidden = false;
    launcher!.setAttribute('aria-expanded', 'false');
    launcher!.focus();
  }

  /* ── Wiring ──────────────────────────────────────────────────────────── */

  launcher.addEventListener('click', openPanel);
  closeBtn?.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });

  log.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-ask]');
    if (!target) return;
    const question = target.dataset.ask ?? '';
    input.value = '';
    void ask(question);
  });

  function syncInput(): void {
    const length = input!.value.trim().length;
    send!.disabled = length === 0 || streaming;
    if (count) {
      const used = input!.value.length;
      count.textContent = used > MAX_MESSAGE - 80 ? `${MAX_MESSAGE - used}` : '';
    }
    input!.style.height = 'auto';
    input!.style.height = `${Math.min(input!.scrollHeight, 96)}px`;
  }

  input.addEventListener('input', syncInput);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form!.requestSubmit();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question || streaming) return;
    input.value = '';
    syncInput();
    void ask(question);
  });

  restore();
  setDots('ready');
}
