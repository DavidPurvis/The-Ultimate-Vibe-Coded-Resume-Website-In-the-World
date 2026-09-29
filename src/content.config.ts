/** Content collections. The blog lives in src/blog as plain Markdown. */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    order: z.number().int(),
    tags: z.array(z.string()),
    /** Résumé blocks the post leans on. Required for a post to name a real employer. */
    blockRefs: z.array(z.string()).optional(),
    /** Placeholder facts to show (only once David fills them in). */
    facts: z.array(z.enum(['applications', 'goldfish', 'r6'])).optional(),
    /** Interactive widget mounted inside the post. */
    interactive: z.enum(['aem']).optional(),
  }),
});

export const collections = { blog };
