#!/usr/bin/env node
// Looks up the GitHub star count of every submitted repo and writes data/stars.json.
// Run by .github/workflows/refresh-stars.yml. Set GITHUB_TOKEN to avoid the 60-requests-an-hour limit.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from './validate-submissions.mjs';

const DIR = 'submissions';
const OUT = 'data/stars.json';
const key = (url) => url.replace(/^https:\/\/github\.com\//, '').replace(/\/+$/, '').replace(/\.git$/, '').toLowerCase();

const previous = JSON.parse(readFileSync(OUT, 'utf8'));
const repos = new Set();
for (const f of readdirSync(DIR)) {
  if (f === 'README.md' || !f.endsWith('.md')) continue;
  const url = parse(readFileSync(`${DIR}/${f}`, 'utf8'))?.data.github_url;
  if (url) repos.add(key(url));
}

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'projek-seratus-stars' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const out = {};
for (const repo of [...repos].sort()) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (res.ok) {
      const j = await res.json();
      out[repo] = { stars: j.stargazers_count };
    } else if (previous[repo]) {
      out[repo] = previous[repo]; // keep the last known count if the lookup fails
      console.warn(`${repo}: HTTP ${res.status}, kept previous count`);
    } else {
      out[repo] = { stars: 0 };
      console.warn(`${repo}: HTTP ${res.status}`);
    }
  } catch (err) {
    out[repo] = previous[repo] ?? { stars: 0 };
    console.warn(`${repo}: ${err.message}`);
  }
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${Object.keys(out).length} repos to ${OUT}`);
