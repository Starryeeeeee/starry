/**
 * 动态数据文件（src/data/moments.md）的解析与序列化。
 *
 * 文件格式：每条动态以 @@ 行开头，后面跟正文（可多行），到下一个 @@ 或文件结束：
 *
 *   @@ 2026-11-14T21:30+08:00 | moment | m-20261114-2130-a1b2c3
 *   今天月考完了……
 *
 * @@ 行三个字段用竖线分隔：发布时间（ISO，含时区）| 类型 | 条目 ID。
 * 正文行只要不整体匹配 @@ 头部的格式，写什么都安全。
 * 构建端（lib/moments.ts）与客户端（/admin、首页快速记录）共用本模块。
 */

export type MomentKind = 'moment' | 'quote' | 'view';

/** 仓库内动态文件的路径（Contents API 读写用） */
export const MOMENTS_FILE_PATH = 'src/data/moments.md';

/** 写回时置顶的说明注释（手工编辑者看得见，解析器会忽略第一个 @@ 之前的所有行） */
export const MOMENTS_FILE_HEADER =
  '<!-- 星野漫游 · 动态数据文件：每条以 @@ 行开头 = 发布时间 | 类型(moment|quote|view) | ID，正文跟在下一行，可多行。后台与快速记录会自动维护；手工编辑别改 @@ 行的格式。 -->';

export type FileMoment = {
  id: string;
  /** ISO 时间，含时区（如 2026-11-14T21:30+08:00） */
  at: string;
  kind: MomentKind;
  text: string;
};

const HEADER_LINE = /^@@\s+(\S+)\s*\|\s*(moment|quote|view)\s*\|\s*(\S+)\s*$/;

/** 解析整个文件；第一个 @@ 之前的行（注释）一律忽略 */
export function parseMomentsFile(raw: string): FileMoment[] {
  const out: FileMoment[] = [];
  let cur: FileMoment | null = null;
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(HEADER_LINE);
    if (m) {
      if (cur) out.push(cur);
      cur = { at: m[1], kind: m[2] as MomentKind, id: m[3], text: '' };
    } else if (cur) {
      cur.text += (cur.text ? '\n' : '') + line;
    }
  }
  if (cur) out.push(cur);
  for (const e of out) e.text = e.text.replace(/\s+$/, '').trim();
  return out;
}

/** 单条 → 文件里的一个块（@@ 头 + 正文） */
export function serializeMomentEntry(e: FileMoment): string {
  return `@@ ${e.at} | ${e.kind} | ${e.id}\n${e.text.replace(/\r?\n$/, '')}`;
}

/** 全部条目 → 完整文件内容（说明注释置顶，条目按传入顺序） */
export function momentsFileBody(entries: FileMoment[]): string {
  return (
    MOMENTS_FILE_HEADER +
    '\n\n' +
    entries.map(serializeMomentEntry).join('\n\n') +
    (entries.length ? '\n' : '')
  );
}

/** Date → 文件里的时间戳。固定按东八区写（站主在国内），例：2026-11-14T21:30+08:00 */
export function toFileStamp(d: Date): string {
  const shift = new Date(d.getTime() + 8 * 3600_000);
  return `${shift.toISOString().slice(0, 19)}+08:00`;
}

/** 新条目 ID：m-20261114-2130-a1b2c3（东八区时间 + 随机尾巴） */
export function newMomentId(d: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  const shift = new Date(d.getTime() + 8 * 3600_000);
  const stamp = `${shift.getUTCFullYear()}${p(shift.getUTCMonth() + 1)}${p(shift.getUTCDate())}-${p(
    shift.getUTCHours(),
  )}${p(shift.getUTCMinutes())}`;
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
  return `m-${stamp}-${rand}`;
}
