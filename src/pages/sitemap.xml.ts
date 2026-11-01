import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// 手写站点地图，不引 @astrojs/sitemap：项目页面数量少，多一个依赖不值
const STATIC_PAGES: Array<[string, number]> = [
  ['/', 1],
  ['/posts/', 0.9],
  ['/moments/', 0.8],
  ['/kb/', 0.8],
  ['/projects/', 0.7],
  ['/skills/', 0.7],
  ['/gallery/', 0.6],
  ['/quotes/', 0.5],
  ['/views/', 0.5],
  ['/changelog/', 0.5],
  ['/about/', 0.6],
];

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://starryeeeeee.github.io')).origin;
  const base = import.meta.env.BASE_URL; // '/starry/'
  const home = `${origin}${base}`;
  const abs = (path: string) => new URL(path.replace(/^\//, ''), home).href;

  const entries: Array<{ loc: string; lastmod?: string; priority: number }> = STATIC_PAGES.map(
    ([path, priority]) => ({ loc: abs(path), priority }),
  );

  const collections = await Promise.all([
    getCollection('posts'),
    getCollection('skills'),
    getCollection('kb'),
  ]);

  const [posts, skills, kb] = collections;
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  for (const p of posts) {
    if (p.data.status !== 'public') continue;
    entries.push({ loc: abs(`/posts/${p.id}/`), lastmod: iso(p.data.date), priority: 0.8 });
  }
  for (const s of skills) {
    entries.push({ loc: abs(`/skills/${s.id}/`), lastmod: iso(s.data.date), priority: 0.6 });
  }
  for (const k of kb) {
    if (k.data.status !== 'public') continue;
    entries.push({ loc: abs(`/kb/${k.id}/`), lastmod: iso(k.data.date), priority: 0.6 });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}<priority>${e.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
