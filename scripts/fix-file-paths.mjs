// 把 astro 构建产物 dist/ 中的绝对基路径 /starry/ 改写为相对路径，
// 使整站可通过 file:// 直接双击打开（无需服务器）。
// 仅处理部署到 GitHub Pages 之外的「本地浏览」用途；线上部署仍用 npm run build。

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASE = '/starry/';
const TARGET_EXT = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg']);

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

function relPrefixFor(fileDir) {
  // dist/index.html → 深度 0 → './'
  // dist/kb/index.html → 深度 1 → '../'
  // dist/kb/guide/index.html → 深度 2 → '../../'
  const depth = relative(DIST, fileDir).split(/[\\/]/).filter(Boolean).length;
  return depth === 0 ? './' : '../'.repeat(depth);
}

async function main() {
  let files;
  try {
    files = await walk(DIST);
  } catch {
    console.error('[fix-file-paths] 找不到 dist/，请先运行 astro build');
    process.exit(1);
  }

  let changed = 0;
  for (const file of files) {
    if (!TARGET_EXT.has(file.slice(file.lastIndexOf('.')))) continue;
    const buf = await readFile(file);
    // 跳过含控制字符的二进制文件（TARGET_EXT 已滤掉图片，这里只是兜底）
    const head = buf.toString('latin1', 0, Math.min(buf.length, 8000));
    if (/[\x00-\x08\x0e-\x1f]/.test(head)) continue;
    const text = buf.toString('utf8');
    if (!text.includes('/starry/') && !text.includes('/starry"') && !text.includes("/starry'")) continue;

    const prefix = relPrefixFor(dirname(file));
    // /starry/... → 前缀 + ...（吃掉斜杠，避免双斜杠）
    // /starry" 或 /starry'（根路径、无后续斜杠）同样替换为前缀
    const rewritten = text
      .replace(/\/starry\//g, prefix)
      .replace(/\/starry(?=["'])/g, prefix);
    if (rewritten !== text) {
      await writeFile(file, rewritten, 'utf8');
      changed++;
    }
  }
  console.log(`[fix-file-paths] 已改写 ${changed} 个文件为相对路径，可双击 dist/index.html 打开。`);
}

main();
