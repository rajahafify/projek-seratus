#!/usr/bin/env node
// Checks every file in /slots. In a pull request it also checks that the PR author
// only adds or edits their own slot (skipped for the repo's owners and collaborators).
//
//   node scripts/validate-slots.mjs
//   PR_AUTHOR=octocat PR_ASSOCIATION=NONE BASE_REF=origin/main node scripts/validate-slots.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const DIR = 'slots';
const NAME_RE = /^(\d{3})\.md$/;
const USER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)?\/?$/;
const WEB_RE = /^https?:\/\/[^\s]+$/;
const KEYS = new Set(['project', 'maker', 'github_user', 'repo', 'website', 'status']);

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

function check(name, text) {
  const errs = [];
  const n = name.match(NAME_RE);
  if (!n) return [`${name}: name the file by its slot number, like 007.md`];
  const num = Number(n[1]);
  if (num < 1 || num > 100) errs.push(`${name}: slot numbers go from 001 to 100`);
  const fm = parse(text);
  if (!fm) return [...errs, `${name}: the file must start with a --- front matter block ---`];
  const d = fm.data;
  if (d.__bad) errs.push(`${name}: can't read the line "${d.__bad}"`);
  for (const k of Object.keys(d)) if (k !== '__bad' && !KEYS.has(k)) errs.push(`${name}: unknown field "${k}"`);
  if (!d.project || d.project.length > 80) errs.push(`${name}: "project" is required (max 80 characters)`);
  if (!d.maker || d.maker.length > 100) errs.push(`${name}: "maker" is required (max 100 characters)`);
  if (!USER_RE.test(d.github_user ?? '')) errs.push(`${name}: "github_user" must be your GitHub username`);
  if (!REPO_RE.test(d.repo ?? '')) errs.push(`${name}: "repo" must be a link that starts with https://github.com/`);
  if (d.website && !WEB_RE.test(d.website)) errs.push(`${name}: "website" must be a full link that starts with https://`);
  if (d.status && !['building', 'shipped'].includes(d.status)) errs.push(`${name}: "status" must be building or shipped`);
  if (fm.body.length > 500) errs.push(`${name}: keep the description under 500 characters`);
  return errs;
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

function main() {
  const errors = [];
  const files = readdirSync(DIR).filter((f) => f !== 'README.md');
  for (const f of files) errors.push(...check(f, readFileSync(`${DIR}/${f}`, 'utf8')));

  const { PR_AUTHOR, PR_ASSOCIATION, BASE_REF } = process.env;
  const trusted = ['OWNER', 'MEMBER', 'COLLABORATOR'].includes(PR_ASSOCIATION ?? '');
  if (PR_AUTHOR && BASE_REF && !trusted) {
    const changed = git('diff', '--name-status', `${BASE_REF}...HEAD`, '--', DIR)
      .trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
    const touched = [];
    for (const [status, ...paths] of changed) {
      for (const p of paths) {
        const name = p.slice(DIR.length + 1);
        if (name === 'README.md') { errors.push('Only maintainers can edit slots/README.md'); continue; }
        touched.push(name);
        // The file as it is now, and as it was on the base branch, must both belong to the author.
        const owners = [];
        if (!status.startsWith('D')) owners.push(parse(readFileSync(p, 'utf8'))?.data.github_user);
        try { owners.push(parse(git('show', `${BASE_REF}:${p}`))?.data.github_user); } catch { /* new file */ }
        for (const o of owners) {
          if (o && o.toLowerCase() !== PR_AUTHOR.toLowerCase()) {
            errors.push(`${name}: this slot belongs to @${o}; you can only add or edit your own slot`);
          }
        }
      }
    }
    if (new Set(touched).size > 1) errors.push('Claim one slot per pull request');
  }

  if (errors.length) {
    console.error('Slot check failed:\n' + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }
  console.log(`Slot check passed (${files.length} slot${files.length === 1 ? '' : 's'}).`);
}

main();
