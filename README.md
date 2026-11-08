# Projek Seratus

**Seratus projek. Satu tujuan.** · One hundred projects. One cause.

Projek Seratus is a community effort to build 100 projects for a common cause. Every project claims one slot on a 10×10 board until all hundred are done.

Live site: https://projek-seratus.artifisi.com

## How submissions work

There is no database and no login. The repository is the database.

- Every project is one file in [`submissions/`](submissions/), named after its title (`peta-banjir.md`), with three fields: `title` and `github_url` (required) and `website_url` (optional).
- The [submission form](https://projek-seratus.artifisi.com/apply) builds that file and opens GitHub's "new file" page with it filled in. The submitter commits it and opens a pull request.
- The **Check submissions** GitHub Action validates the file, rejects a repository that's already been submitted, checks that the repository is public, and makes sure outside contributors only add new files (they can't edit or remove other people's submissions).
- A maintainer merges the pull request to accept the project.
- Nobody picks a slot. The **Refresh stars** workflow looks up every repository's GitHub stars daily, and again after each merge, and commits them to `data/stars.json`. The 100 most-starred projects fill the board, and the rest are listed below it. Each of those commits redeploys the site.

## Develop

```sh
npm install
npm run dev                          # http://localhost:4321
node scripts/validate-submissions.mjs   # check the submission files
node scripts/refresh-stars.mjs          # update data/stars.json (set GITHUB_TOKEN)
npm run build                        # static site in ./dist
```

Built with [Astro](https://astro.build). The page text is in English in the markup, and Bahasa Melayu strings are in `src/lib/i18n.ts`.

## Deploy (Cloudflare)

The site is static and deploys as a Cloudflare Worker with static assets (`wrangler.jsonc`).

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Import a repository** and pick this repo.
2. Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
3. Every push to `main`, including every merged slot, now redeploys the site.
4. `wrangler.jsonc` attaches the custom domain `projek-seratus.artifisi.com`. This works when `artifisi.com` is a zone in the same Cloudflare account.

To deploy by hand instead: `npx wrangler login`, then `npm run deploy`.

## Start your own Projek Seratus

1. Fork this repository.
2. Change `REPO` in `src/lib/site.ts` to your fork, and edit the cause and text in `src/pages/index.astro` and `src/lib/i18n.ts`.
3. Change the `name` and the domain in `wrangler.jsonc`, then connect your fork to Cloudflare as above.
4. Delete the files in `submissions/` other than `README.md`, and reset `data/stars.json` to `{}`, so your board starts empty.

## License

[MIT](LICENSE). Fork it and run your own.
