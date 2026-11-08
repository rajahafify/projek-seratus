#!/usr/bin/env node
// Checks every file in /submissions. In a pull request from someone outside the repo's
// owners and collaborators, it also checks that the PR only adds new submissions and
// that each new github_url points to a real public repository.
//
//   node scripts/validate-submissions.mjs
//   PR_AUTHOR=octocat PR_ASSOCIATION=NONE BASE_REF=origin/main node scripts/validate-submissions.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DIR = 'submissions';
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,59}\.md$/;
const REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
const WEB_RE = /^https?:\/\/[^\s]+$/;
const KEYS = new Set(['title', 'github_url', 'website_url']);

export function parse(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) { data.__bad = line; continue; }
    let v = kv[2].trim();
    const q = v.match(/^"((?:[^"\\]|\\.)*)"/) || v.match(/^'((?:[^']|'')*)'/);
    if (q) v = v.startsWith('"') ? JSON.parse(`"${q[1]}"`) : q[1].replace(/''/g, "'");
    else v = v.replace(/\s+#.*$/, '').trim();
    data[kv[1]] = v;
  }
  return { data, body: m[2].trim() };
}

const repoKey = (url) => url.replace(/^https:\/\/github\.com\//, '').replace(/\/+$/, '').replace(/\.git$/, '').toLowerCase();

function check(name, text) {
  const errs = [];
  if (!NAME_RE.test(name)) errs.push(`${name}: use lowercase letters, numbers and dashes for the file name, like my-project.md`);
  const fm = parse(text);
  if (!fm) return [...errs, `${name}: the file must start with a --- front matter block ---`];
  const d = fm.data;
  if (d.__bad) errs.push(`${name}: can't read the line "${d.__bad}"`);
  for (const k of Object.keys(d)) if (k !== '__bad' && !KEYS.has(k)) errs.push(`${name}: unknown field "${k}"`);
  if (!d.title || d.title.length > 80) errs.push(`${name}: "title" is required (max 80 characters)`);
  if (!REPO_RE.test(d.github_url ?? '')) errs.push(`${name}: "github_url" must link to a repository, like https://github.com/owner/repo`);
  if (d.website_url && !WEB_RE.test(d.website_url)) errs.push(`${name}: "website_url" must be a full link that starts with https://`);
  if (fm.body.length > 500) errs.push(`${name}: keep any description under 500 characters`);
  return errs;
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

async function repoExists(repo) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'projek-seratus-check' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return !(await res.json()).private;
}

async function main() {
  const errors = [];
  const files = readdirSync(DIR).filter((f) => f !== 'README.md');
  const seen = new Map();
  for (const f of files) {
    const text = readFileSync(`${DIR}/${f}`, 'utf8');
    errors.push(...check(f, text));
    const url = parse(text)?.data.github_url;
    if (url && REPO_RE.test(url)) {
      const k = repoKey(url);
      if (seen.has(k)) errors.push(`${f}: ${url} is already submitted in ${seen.get(k)}`);
      else seen.set(k, f);
    }
  }

  const { PR_AUTHOR, PR_ASSOCIATION, BASE_REF } = process.env;
  const trusted = ['OWNER', 'MEMBER', 'COLLABORATOR'].includes(PR_ASSOCIATION ?? '');
  if (PR_AUTHOR && BASE_REF && !trusted) {
    const changed = git('diff', '--name-status', `${BASE_REF}...HEAD`, '--', DIR)
      .trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
    for (const [status, ...paths] of changed) {
      const name = paths.at(-1).slice(DIR.length + 1);
      if (status !== 'A') {
        errors.push(`${name}: only maintainers can change or remove existing submissions. Add a new file instead.`);
        continue;
      }
      const url = parse(readFileSync(`${DIR}/${name}`, 'utf8'))?.data.github_url;
      if (!url || !REPO_RE.test(url)) continue;
      try {
        if (!(await repoExists(repoKey(url)))) errors.push(`${name}: ${url} is not a public GitHub repository`);
      } catch (err) {
        console.warn(`Could not look up ${url} (${err.message}); skipping that check.`);
      }
    }
  }

  if (errors.length) {
    console.error('Submission check failed:\n' + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }
  console.log(`Submission check passed (${files.length} submission${files.length === 1 ? '' : 's'}).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
