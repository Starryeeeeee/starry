// 从 jsDelivr 拉取用户仓库里的字体子集（truth-or-dare 的 subset-body、Game1 的 subset-main）
import fs from 'node:fs';
import path from 'node:path';

const targets = [
  { repo: 'truth-or-dare', dir: 'subset-body', out: 'public/fonts/hanchan' },
  { repo: 'Game1', dir: 'subset-main', out: 'public/fonts/zihun' },
];

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  return r.json();
}

async function download(repo, dir, file, out) {
  const url = `https://cdn.jsdelivr.net/gh/Starryeeeeee/${repo}@main/${dir}/${file}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(path.join(out, file), buf);
}

for (const t of targets) {
  fs.mkdirSync(t.out, { recursive: true });
  const tree = await getJson(
    `https://api.github.com/repos/Starryeeeeee/${t.repo}/git/trees/main?recursive=1`,
  );
  const files = tree.tree
    .map((e) => e.path)
    .filter((p) => p.startsWith(t.dir + '/') && p.endsWith('.woff2'))
    .map((p) => p.slice(t.dir.length + 1));
  console.log(t.repo, t.dir, '->', files.length, 'woff2 files');
  files.push('result.css');
  let done = 0;
  const queue = [...files];
  async function worker() {
    while (queue.length) {
      const f = queue.shift();
      try {
        await download(t.repo, t.dir, f, t.out);
      } catch (e) {
        console.error('FAIL', f, e.message);
        queue.push(f); // 重试一次的机会
        if (++attempts[f] > 2) throw new Error('give up on ' + f);
        continue;
      }
      done++;
      if (done % 20 === 0) console.log(' ', done, '/', files.length);
    }
  }
  const attempts = {};
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(t.out, 'complete:', done, 'files');
}
console.log('ALL DONE');
