/**
 * 知识库：两类条目合成一条流。
 *
 * 1. 手写条目（src/content/kb/*.md）：定理、公式、解题技巧等，
 *    markdown 正文，支持 $...$ 数学公式，详情页全文渲染。
 * 2. 上传文档（src/data/kb-files.json）：pdf / word / ppt 等，
 *    文件本体在 public/kb/，清单记录元数据，详情页提供预览或下载。
 *
 * /admin 管理面板的「知识库」tab 负责两条通道的写入与删除。
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import rawFiles from '../data/kb-files.json';

export type KbFileRecord = {
  /** 详情页路由 id，同时是唯一标识 */
  slug: string;
  title: string;
  subject: string;
  tags: string[];
  description: string;
  /** 相对站点根的文件路径，如 /kb/2026-10-30-笔记.pdf */
  file: string;
  ext: string;
  /** 字节数 */
  size: number;
  date: string; // YYYY-MM-DD
};

export type KbEntry = {
  kind: 'note' | 'file';
  slug: string;
  title: string;
  subject: string;
  tags: string[];
  description: string;
  date: Date;
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
  }));

  const fileEntries: KbEntry[] = kbFileRecords.map((f) => ({
    kind: 'file' as const,
    slug: f.slug,
    title: f.title,
    subject: f.subject,
    tags: f.tags,
    description: f.description,
    date: new Date(f.date),
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
