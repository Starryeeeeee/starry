// 临时脚本：分析 cn-font-split 的 result.css 里是什么字体
import fs from 'node:fs';

for (const f of ['tmp-subset.css', 'tmp-subset-body.css', 'tmp-subset-main.css']) {
  const css = fs.readFileSync(f, 'utf8');
  const families = [...css.matchAll(/font-family:\s*["']?([^;"']+)["']?/g)].map((m) => m[1].trim());
  const weights = [...css.matchAll(/font-weight:\s*([^;]+);/g)].map((m) => m[1].trim());
  const styles = [...css.matchAll(/font-style:\s*([^;]+);/g)].map((m) => m[1].trim());
  const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
  console.log('====', f);
  console.log('faces:', (css.match(/@font-face/g) || []).length);
  console.log('families:', [...new Set(families)]);
  console.log('weights:', [...new Set(weights)]);
  console.log('styles:', [...new Set(styles)]);
  console.log('url sample:', urls[0], '| total urls:', urls.length);
}
