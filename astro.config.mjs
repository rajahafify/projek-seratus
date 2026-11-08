// @ts-check
import { defineConfig } from 'astro/config';

// Static output: Firebase (Auth + Firestore) runs in the browser, so the site
// can be served as plain assets from Cloudflare. If we later need server code,
// add the @astrojs/cloudflare adapter and switch output to 'server'.
export default defineConfig({
  site: 'https://projek-seratus.artifisi.com',
  output: 'static',
});
