import { getCollection } from 'astro:content';
import stars from '../../data/stars.json';
import { SLOT_COUNT, repoKey } from './site';

export interface Ranked {
  rank: number;
  id: string;
  title: string;
  github_url: string;
  website_url?: string;
  repo: string;
  stars: number;
}

const starMap = stars as Record<string, { stars: number }>;

/**
 * Every accepted submission, most-starred first. Star counts come from data/stars.json,
 * which the "Refresh stars" workflow updates daily and after each merge.
 * Ties keep a stable order by title.
 */
export async function getRanking(): Promise<{ all: Ranked[]; board: Ranked[] }> {
  const entries = await getCollection('submissions');
  const all = entries
    .map((e) => {
      const repo = repoKey(e.data.github_url);
      return { id: e.id, ...e.data, repo, stars: starMap[repo]?.stars ?? 0 };
    })
    .sort((a, b) => b.stars - a.stars || a.title.localeCompare(b.title))
    .map((s, i) => ({ ...s, rank: i + 1 }));
  return { all, board: all.slice(0, SLOT_COUNT) };
}
