/**
 * 构建时生成全站结构化索引 /api-index.json，供 AI 资料问答检索用（路线图第 5 项）。
 *
 * - 包含文章、知识库笔记（含正文截断）、知识库文档（仅元数据，PDF 正文抽不出来）、
 *   废话条（Issues 文本）；草稿一律跳过，归档保留（直链可见的内容 AI 也该知道）。
 * - 每条都带稳定内容 ID（没有的历史内容回退 slug），与 giscus / 点赞 / 未来检索一致。
 * - 站点小，整包 JSON 体积有限；若以后条目多了，再考虑分片或改成按需检索。
 */
import { getCollection } from 'astro:content';
import kbFileRecords from '../data/kb-files.json';
import { getMoments } from '../lib/moments';
import { fileKindLabel } from '../lib/kb';

/** 每条正文最多保留多少字符（AI 上下文有限，太多反而稀释检索命中） */
const MAX_BODY = 1600;

export async function GET() {
  const [posts, kbNotes, moments] = await Promise.all([
    getCollection('posts'),
    getCollection('kb'),
    getMoments(),
  ]);

  const entries: Array<Record<string, unknown>> = [];

  for (const p of posts) {
    if (p.data.status === 'draft') continue;
    entries.push({
      id: p.data.id ?? p.id,
      type: 'post',
      title: p.data.title,
      path: `/posts/${p.id}/`,
      date: p.data.date.toISOString().slice(0, 10),
      tags: p.data.tags,
      description: p.data.description ?? '',
      status: p.data.status,
      content: p.body?.slice(0, MAX_BODY) ?? '',
    });
  }

  for (const n of kbNotes) {
    if (n.data.status === 'draft') continue;
    entries.push({
      id: n.data.id ?? n.id,
      type: 'kb-note',
      title: n.data.title,
      path: `/kb/${n.id}/`,
      date: n.data.date.toISOString().slice(0, 10),
      subject: n.data.subject,
      tags: n.data.tags,
      description: n.data.description,
      status: n.data.status,
      content: n.body?.slice(0, MAX_BODY) ?? '',
    });
  }

  for (const f of kbFileRecords) {
    if (f.status === 'draft') continue;
    entries.push({
      id: f.id ?? f.slug,
      type: 'kb-file',
      title: f.title,
      path: `/kb/${f.slug}/`,
      date: f.date,
      subject: f.subject,
      tags: f.tags,
      description: [f.description, `${fileKindLabel(f.ext)}，文件 ${f.file}`].filter(Boolean).join('；'),
      status: f.status ?? 'public',
    });
  }

  for (const m of moments) {
    entries.push({
      id: m.id,
      type: 'moment',
      title: m.text,
      date: m.date.toISOString().slice(0, 10),
      content: m.text,
    });
  }

  return new Response(
    JSON.stringify({ generated: new Date().toISOString(), entries }, null, 2),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
}
