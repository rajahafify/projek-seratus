import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Each claimed slot is one file in /slots, named by its number: slots/007.md
// A pull request adds the file; merging it approves the claim.
export const GITHUB_REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)?\/?$/;

const slots = defineCollection({
  loader: glob({ pattern: '[0-9][0-9][0-9].md', base: './slots' }),
  schema: z.object({
    project: z.string().min(1).max(80),
    maker: z.string().min(1).max(100),
    github_user: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/),
    repo: z.string().regex(GITHUB_REPO_RE),
    website: z.url().optional(),
    status: z.enum(['building', 'shipped']).default('building'),
  }),
});

export const collections = { slots };
