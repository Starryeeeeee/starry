/**
 * 画廊：仓库里的老图 + R2 里的新图合成一条流。
 *
 * - 老图：src/assets/gallery/*.jpg 等，由 Astro 的 Image 组件处理（会生成优化尺寸与 webp）；
 * - 新图：上传到 Cloudflare R2，清单（src/data/gallery-files.json）记元数据与对象键，
 *   原图直链引用，不进 Git 仓库（见《改进计划》P5.4）。
 *
 * 两条链路按 storage 字段区分：'r2' 走外链，其余走站点内路径。
 */
import raw from '../data/gallery-files.json';
import { fileHref } from './storage';

export type GalleryFileRecord = {
  /** 唯一标识（也是排序依据之一） */
  id: string;
  /** R2 对象键（storage='r2'）或站点内路径 */
  file: string;
  /** 文件存在哪：r2 = Cloudflare R2；缺省 = 仓库内 */
  storage?: 'r2' | 'legacy';
  /** 图注 */
  caption: string;
  /** 拍摄/上传日期 YYYY-MM-DD */
  date: string;
  /** 字节数 */
  size?: number;
};

export const galleryFileRecords = raw as GalleryFileRecord[];

/** 清单记录 → 可访问地址 */
export const galleryHref = (rec: { file: string; storage?: string }) => fileHref(rec);
