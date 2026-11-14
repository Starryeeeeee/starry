/**
 * 外部存储（Cloudflare R2）配置与地址组合。
 *
 * 背景：《改进计划》P5.4 —— 上传的文件本体存 Cloudflare R2，GitHub 仓库只留元数据清单，
 * 新上传的文件不再让仓库继续膨胀。
 *
 * 配置写在 public/site-config.json 的 storage 字段（/admin 可改，构建时读得到）：
 *   {
 *     "storage": {
 *       "workerUrl": "https://starry-file-upload.<子域>.workers.dev",  // 上传服务
 *       "publicBase": "https://pub-xxxxxxxx.r2.dev"                   // R2 公开访问地址
 *     }
 *   }
 *
 * 清单里的 file 字段有两种形态：
 * - 新条目：storage = 'r2'，file 存 R2 对象键（如 kb/20261114-171233-a1b2c3d4.pdf）
 * - 老条目：没有 storage 字段，file 存站点内路径（如 /kb/2026-10-30-讲义.pdf）
 */
import cfg from '../../public/site-config.json';
import { u } from './base';

export type StorageConfig = {
  /** 上传服务（Cloudflare Worker）地址 */
  workerUrl?: string;
  /** R2 公开访问地址（文件最终能被浏览器访问的地方） */
  publicBase?: string;
};

const siteCfg = cfg as { storage?: StorageConfig };

export const storageConfig: StorageConfig = siteCfg.storage ?? {};

/** R2 公开访问地址（去掉尾部斜杠）；未配置时为空串 */
export const r2PublicBase = (storageConfig.publicBase ?? '').trim().replace(/\/+$/, '');

/** 是否已配置好 R2（后台据此提示"还没配置上传服务"） */
export const isR2Configured = () => Boolean(storageConfig.workerUrl && r2PublicBase);

/**
 * 清单记录 → 可访问地址。
 * - storage === 'r2'：file 是对象键，拼成外链（不经过 u()，外链没有 base 前缀这回事）
 * - 其余（老条目）：file 是站点内路径，走 u() 适配 /starry/ 前缀
 */
export function fileHref(rec: { file: string; storage?: string }): string {
  if (rec.storage === 'r2') return r2PublicBase ? `${r2PublicBase}/${rec.file}` : rec.file;
  return u(rec.file);
}
