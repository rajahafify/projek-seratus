import { t } from '../lib/i18n';
import { slotId } from '../lib/site';

interface Ranked {
  rank: number;
  title: string;
  github_url: string;
  website_url?: string;
  repo: string;
  stars: number;
}

const board = document.getElementById('board');
const detail = document.getElementById('slot-detail');
const dataEl = document.getElementById('slots-data');

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
    const a = el('a', '', text);
    a.href = href; a.target = '_blank'; a.rel = 'noopener nofollow';
    return a;
  };
  const stars = (n: number) => `★ ${n.toLocaleString('en-US')}`;

  function render() {
    for (const c of cells) {
      const n = Number(c.dataset.n);
      const p = ranked.get(n);
      c.classList.toggle('is-selected', selected === n);
      c.setAttribute('aria-pressed', String(selected === n));
      c.title = `${t('slot.label')} ${slotId(n)}: ${p ? `${p.title}, ${stars(p.stars)}` : t('slot.open')}`;
      c.setAttribute('aria-label', c.title);
    }

    const p = selected ? ranked.get(selected) : undefined;
    if (p) {
      const links = el('p', 'links');
      links.append(link(p.github_url, 'GitHub'));
      if (p.website_url) links.append(link(p.website_url, t('board.website')));
      const card = el('div', 'detail-card');
      card.append(
        el('p', 'eyebrow', `${t('slot.label')} ${slotId(p.rank)} · ${stars(p.stars)}`),
        el('h3', '', p.title),
        el('p', 'by', p.repo),
        links,
      );
      detail!.replaceChildren(card);
    } else {
      const msg = ranked.size === 0 ? t('board.footEmpty')
        : ranked.size < cells.length ? fill(t('board.footSome'), { count: ranked.size })
        : t('board.footFull');
      detail!.replaceChildren(el('p', '', msg));
    }
  }

  for (const c of cells) {
    c.addEventListener('click', () => {
      const n = Number(c.dataset.n);
      selected = selected === n ? null : n;
      render();
    });
  }
  render();
  document.addEventListener('langchange', render);
}
