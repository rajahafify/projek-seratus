import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Each submitted project is one file in /submissions, named after its title: submissions/peta-banjir.md
// A pull request adds the file; merging it accepts the project. Slots are given by GitHub stars, not chosen.
export const REPO_URL_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;

const submissions = defineCollection({
  loader: glob({ pattern: ['*.md', '!README.md'], base: './submissions' }),
  schema: z.object({
    title: z.string().min(1).max(80),
    github_url: z.string().regex(REPO_URL_RE),
    website_url: z.url().optional(),
  }),
});

export const collections = { submissions };
