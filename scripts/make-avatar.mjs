// 一次性工具：把根目录的用户图片处理成圆形头像源图，并把原图移入画廊
// 用法：npm 没有依赖额外包，直接 node scripts/make-avatar.mjs
import sharp from 'sharp';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';

const SRC = '微信图片_20261025124607_16_1.jpg';
const AVATAR_OUT = 'src/assets/avatar.jpg';
const GALLERY_DIR = 'src/assets/gallery';
const GALLERY_NAME = 'src/assets/gallery/2026-10-25 星夜与树.jpg';

const meta = await sharp(SRC).metadata();
console.log(`原图尺寸：${meta.width} x ${meta.height}`);

// 取最长边的正方形（图片接近正方形时即整图），稍微向画面主体（树）偏移
const size = Math.min(meta.width, meta.height);
const left = Math.round((meta.width - size) / 2);
const top = Math.round(Math.max(0, (meta.height - size) / 2 * 0.6));

mkdirSync('src/assets', { recursive: true });
await sharp(SRC)
  .extract({ left, top, width: size, height: size })
  .resize(512, 512)
  .jpeg({ quality: 88 })
  .toFile(AVATAR_OUT);
console.log(`已生成 ${AVATAR_OUT}`);

mkdirSync(GALLERY_DIR, { recursive: true });
copyFileSync(SRC, GALLERY_NAME);
console.log(`原图已存入画廊：${GALLERY_NAME}`);

rmSync(SRC);
console.log('根目录原图已清理');
