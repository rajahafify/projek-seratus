// Change these when you fork Projek Seratus for your own cause.
export const REPO = 'rajahafify/projek-seratus';
export const BRANCH = 'main';
export const REPO_URL = `https://github.com/${REPO}`;
export const SLOT_COUNT = 100;
export const slotId = (n: number) => String(n).padStart(3, '0');

/** "Peta Banjir: Komuniti!" -> "peta-banjir-komuniti" (the submission's file name). */
export const slugify = (title: string) =>
  title.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/** "https://github.com/Owner/Repo/" -> "owner/repo" */
export const repoKey = (url: string) =>
  url.replace(/^https:\/\/github\.com\//, '').replace(/\/+$/, '').replace(/\.git$/, '').toLowerCase();
