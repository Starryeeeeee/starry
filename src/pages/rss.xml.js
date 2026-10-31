import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { u } from '../lib/base';

export async function GET(context) {
  const posts = (await getCollection('posts'))
    .filter((post) => post.data.status !== 'draft' && post.data.status !== 'archived')
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: '星野漫游 · Starry Roam',
    description: 'Starry 的个人星球：作品、AI Skills、文章随感与日常废话条。',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.date,
      link: u(`/posts/${post.id}/`),
    })),
  });
}
