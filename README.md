# Projek Seratus

**Seratus projek. Satu tujuan.** · One hundred projects. One cause.

Projek Seratus is a community effort to build 100 projects for a common cause. Every project claims one slot on a 10×10 board until all hundred are done.

Live site: https://projek-seratus.artifisi.com

## How claiming works

There is no database and no login. The repository is the database.

- Every claimed slot is one file in [`slots/`](slots/), named by its number (`001.md` to `100.md`).
- The [claim form](https://projek-seratus.artifisi.com/apply) builds that file and opens GitHub's "new file" page with it filled in. The applicant commits it and opens a pull request.
- The **Check slots** GitHub Action validates the file and checks that the pull request author is the `github_user` in it (people can only add or edit their own slot).
- A maintainer merges the pull request. Cloudflare rebuilds the site and the slot appears on the board.
- When a project ships, its maker opens another pull request that changes `status: building` to `status: shipped`.

If two people claim the same number at once, the second pull request will conflict. Rename that file to the next open number before merging.

## Develop

```sh
npm install
npm run dev                          # http://localhost:4321
node scripts/validate-slots.mjs      # check the slot files
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
4. Delete any files in `slots/` other than `README.md` so your board starts empty.
