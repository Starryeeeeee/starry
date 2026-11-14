/**
 * 知识库：两类条目合成一条流。
 *
 * 1. 手写条目（src/content/kb/*.md）：定理、公式、解题技巧等，
 *    markdown 正文，支持 $...$ 数学公式，详情页全文渲染。
 * 2. 上传文档（src/data/kb-files.json）：pdf / word / ppt 等，
 *    清单记录元数据，详情页提供预览或下载。
 *
 * 文件本体存放在哪：
 * - 新上传的文件在 Cloudflare R2，清单里存对象键（storage: 'r2'），见《改进计划》P5.4；
 * - 老的文件仍在 public/kb/，清单里存站点内路径（没有 storage 字段）。
 *   两种形态都由 src/lib/storage.ts 的 fileHref() 统一转成可访问地址。
 *
 * /admin 管理面板的「知识库」tab 负责两条通道的写入与删除。
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import rawFiles from '../data/kb-files.json';
import { fileHref } from './storage';

export type KbAccess = 'public' | 'personal' | 'private';

export type KbFileRecord = {
  /** 详情页路由 id，同时是唯一标识 */
  slug: string;
  /** 稳定内容 ID（后加的文档可能没有，读取端按 slug 兜底） */
  id?: string;
  title: string;
  subject: string;
  tags: string[];
  description: string;
  /** 站点内路径（如 /kb/2026-10-30-笔记.pdf）或 R2 对象键（storage='r2' 时） */
  file: string;
  /** 文件存在哪：r2 = Cloudflare R2；缺省 = 仓库 public/kb/（老条目） */
  storage?: 'r2' | 'legacy';
  ext: string;
  /** 字节数 */
  size: number;
  date: string; // YYYY-MM-DD
  status?: 'draft' | 'public' | 'archived';
  access?: KbAccess;
};

/** 清单记录 → 可访问地址（R2 外链 / 站内路径统一处理） */
export const kbFileHref = (rec: { file: string; storage?: string }) => fileHref(rec);

export type KbEntry = {
  kind: 'note' | 'file';
  slug: string;
  title: string;
  subject: string;
  tags: string[];
  description: string;
  date: Date;
  status?: 'draft' | 'public' | 'archived';
  access: KbAccess;
  /** 仅 kind === 'file' 时有值 */
  file?: string;
  ext?: string;
  sizeKB?: number;
};

export const kbFileRecords = rawFiles as KbFileRecord[];

export async function getKbEntries(): Promise<KbEntry[]> {
  const notes = await getCollection('kb');
  const noteEntries: KbEntry[] = notes.map((n: CollectionEntry<'kb'>) => ({
    kind: 'note' as const,
    slug: n.id,
    title: n.data.title,
    subject: n.data.subject,
    tags: n.data.tags,
    description: n.data.description,
    date: n.data.date,
    status: n.data.status,
    access: n.data.access,
  }));

  const fileEntries: KbEntry[] = kbFileRecords.map((f) => ({
    kind: 'file' as const,
    slug: f.slug,
    title: f.title,
    subject: f.subject,
    tags: f.tags,
    description: f.description,
    date: new Date(f.date),
    status: f.status,
    access: f.access ?? 'public',
    file: f.file,
    ext: f.ext,
    sizeKB: Math.max(1, Math.round(f.size / 1024)),
  }));

  return [...noteEntries, ...fileEntries].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

/** 浏览页筛选用的科目列表（按出现条数排序） */
export function kbSubjects(entries: KbEntry[]): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.subject, (map.get(e.subject) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));
}

/** 文件条目的展示辅助：扩展名 → 类型说明 */
export function fileKindLabel(ext?: string): string {
  const e = (ext ?? '').toLowerCase();
  if (e === 'pdf') return 'PDF 文档';
  if (['doc', 'docx'].includes(e)) return 'Word 文档';
  if (['ppt', 'pptx'].includes(e)) return 'PPT 演示';
  if (['md', 'markdown'].includes(e)) return 'Markdown';
  if (['xls', 'xlsx', 'csv'].includes(e)) return '表格';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'].includes(e)) return '图片';
  if (['zip', '7z', 'rar'].includes(e)) return '压缩包';
  return e ? `${e.toUpperCase()} 文件` : '文件';
}

/** PDF 可在浏览器内直接预览；word/ppt 需下载 */
export function isPreviewable(ext?: string): boolean {
  return (ext ?? '').toLowerCase() === 'pdf';
}

/** 上传文件名 → 安全的仓库文件名（保留中文，去掉路径和特殊字符） */
export function safeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, '').replace(/[#?%*"<>|]/g, '').replace(/\s+/g, '-');
  return base.slice(-80) || 'file';
}

/** 文件名 → 详情页 slug（去扩展名，加日期前缀防撞名） */
export function fileSlug(name: string, date: string): string {
  const stem = safeFileName(name).replace(/\.[^.]+$/, '') || 'file';
  return `${date}-${stem}`.slice(0, 100);
}
