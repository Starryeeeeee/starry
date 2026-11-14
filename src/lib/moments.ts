/**
 * 动态类内容数据源：仓库内的 src/data/moments.md 文件（一个文件装下废话条/箴言/看法）。
 * 每条以 @@ 行开头（发布时间 | 类型 | 条目 ID），构建时直接读仓库文件、按 @@ 切分成多条。
 *
 * 2026-11-14 起不再调 GitHub Issues API——文件就在仓库里，构建必然读得到，
 * 「构建时拉取失败回退占位数据」的隐患随之消失。
 * 文件格式与后台/首页快速记录用的读写工具见 ./moments-file.ts。
 *
 * 发动态：/admin 或首页快速记录 → Contents API 往文件追加一条 → push 本身触发部署。
 */
import raw from '../data/moments.md?raw';
import { parseMomentsFile } from './moments-file';

export type Moment = {
  id: string;
  date: Date;
  text: string;
};

const all = parseMomentsFile(raw)
  .map((e) => ({ id: e.id, kind: e.kind, date: new Date(e.at), text: e.text }))
  .sort((a, b) => b.date.valueOf() - a.date.valueOf());

const byKind = (kind: 'moment' | 'quote' | 'view'): Moment[] =>
  all.filter((m) => m.kind === kind).map(({ id, date, text }) => ({ id, date, text }));

/** 废话条 */
export async function getMoments(): Promise<Moment[]> {
  return byKind('moment');
}

/** 箴言 */
export async function getQuotes(): Promise<Moment[]> {
  return byKind('quote');
}

/** 看法 */
export async function getViews(): Promise<Moment[]> {
  return byKind('view');
}
