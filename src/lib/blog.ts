/** Blog helpers shared by the index, post pages and RSS feed (build time only). */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export async function posts(): Promise<Post[]> {
  return (await getCollection('blog')).sort((a, b) => a.data.order - b.data.order);
}

export { postFormId, readingMinutes } from './blog.pure';
