import { t, lang } from '../lib/i18n';
import { slotId } from '../lib/site';

interface Ranked {
  rank: number;
  title: string;
  github_url: string;
  website_url?: string;
  repo: string;
  stars: number;
}

const board = document.getElementById('board-grid');
const detail = document.getElementById('slot-detail');
const dataEl = document.getElementById('slots-data');

const starsText = (n: number) => {
  const num = n.toLocaleString('en-US');
  if (lang() === 'ms') return `${num} bintang`;
  return `${num} ${n === 1 ? 'star' : 'stars'}`;
};

// Star counts written on the server in English get the current language too.
function relabelStars() {
  document.querySelectorAll<HTMLElement>('[data-stars]').forEach((el) => {
    el.textContent = starsText(Number(el.dataset.stars));
  });
}
document.addEventListener('langchange', relabelStars);
relabelStars();

if (board && detail && dataEl) {
  const ranked = new Map<number, Ranked>((JSON.parse(dataEl.textContent || '[]') as Ranked[]).map((p) => [p.rank, p]));
  const cells = Array.from(board.querySelectorAll<HTMLButtonElement>('.slot'));
  let selected: number | null = null;

  const fill = (s: string, vars: Record<string, string | number>) =>
    s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const link = (href: string, text: string) => {
    const a = el('a', 'link', text);
    a.href = href; a.target = '_blank'; a.rel = 'noopener nofollow';
    return a;
  };

  function render() {
    for (const c of cells) {
      const n = Number(c.dataset.n);
      const p = ranked.get(n);
      c.classList.toggle('is-selected', selected === n);
      if (p) c.setAttribute('aria-pressed', String(selected === n));
      c.setAttribute('aria-label', `${t('slot.label')} ${slotId(n)}: ${p ? `${p.title}, ${starsText(p.stars)}` : t('slot.open')}`);
    }

    const p = selected ? ranked.get(selected) : undefined;
    if (p) {
      const links = el('p', 'links');
      links.append(link(p.github_url, 'GitHub'));
      if (p.website_url) links.append(link(p.website_url, t('board.website')));
      const card = el('div', 'detail-card');
      card.append(
        el('h3', '', p.title),
        el('p', 'meta', `${t('slot.label')} ${slotId(p.rank)} · ${starsText(p.stars)} · ${p.repo}`),
        links,
      );
      detail!.replaceChildren(card);
    } else {
      const msg = ranked.size === 0 ? t('board.footEmpty')
        : ranked.size < cells.length ? fill(t('board.footSome'), { count: ranked.size })
        : t('board.footFull');
      detail!.replaceChildren(el('p', 'msg', msg));
    }
  }

  for (const c of cells) {
    c.addEventListener('click', () => {
      const n = Number(c.dataset.n);
      if (!ranked.has(n)) return;
      selected = selected === n ? null : n;
      render();
    });
  }
  // Open on the top project so the board shows what a slot holds.
  if (ranked.has(1)) selected = 1;
  render();
  document.addEventListener('langchange', render);
}
