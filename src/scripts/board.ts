import { t } from '../lib/i18n';
import { slotId } from '../lib/site';

interface Slot {
  number: number;
  project: string;
  maker: string;
  github_user: string;
  repo: string;
  website?: string;
  status: 'building' | 'shipped';
  description: string;
}

const board = document.getElementById('board');
const detail = document.getElementById('slot-detail');
const dataEl = document.getElementById('slots-data');

if (board && detail && dataEl) {
  const slots = new Map<number, Slot>((JSON.parse(dataEl.textContent || '[]') as Slot[]).map((s) => [s.number, s]));
  const cells = Array.from(board.querySelectorAll<HTMLButtonElement>('.slot'));
  const next = cells.findIndex((c) => !slots.has(Number(c.dataset.n))) + 1;
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

  function render() {
    for (const c of cells) {
      const n = Number(c.dataset.n);
      const s = slots.get(n);
      c.classList.toggle('is-selected', selected === n);
      c.setAttribute('aria-pressed', String(selected === n));
      const state = s ? `${s.project}, ${t('slot.' + s.status)}` : t(n === next ? 'slot.next' : 'slot.open');
      c.title = `${t('slot.label')} ${slotId(n)}: ${state}`;
      c.setAttribute('aria-label', c.title);
    }

    const s = selected ? slots.get(selected) : undefined;
    if (s) {
      const card = el('div', 'detail-card');
      const links = el('p', 'links');
      links.append(link(s.repo, 'GitHub'));
      if (s.website) links.append(link(s.website, t('board.website')));
      card.append(
        el('p', 'eyebrow', `${t('slot.label')} ${slotId(s.number)} · ${t('slot.' + s.status)}`),
        el('h3', '', s.project),
        el('p', 'by', fill(t('board.by'), { name: `${s.maker} (@${s.github_user})` })),
      );
      if (s.description) card.append(el('p', '', s.description));
      card.append(links);
      detail!.replaceChildren(card);
    } else {
      const msg = slots.size === 0 ? t('board.footEmpty')
        : next ? fill(t('board.footNext'), { count: slots.size, n: slotId(next) })
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
