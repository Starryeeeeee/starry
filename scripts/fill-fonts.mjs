// 补漏：对比仓库清单，把缺的字体分片用 GitHub contents API 补齐
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const t of targets) {
  fs.mkdirSync(t.out, { recursive: true });
  const tree = await getJson(
    `https://api.github.com/repos/Starryeeeeee/${t.repo}/git/trees/main?recursive=1`,
  );
  const files = tree.tree
    .map((e) => e.path)
    .filter((p) => p.startsWith(t.dir + '/') && (p.endsWith('.woff2') || p.endsWith('.css')))
    .map((p) => p.slice(t.dir.length + 1));

  const missing = files.filter((f) => !fs.existsSync(path.join(t.out, f)));
  console.log(t.repo, ':', files.length, 'files,', missing.length, 'missing ->', missing.join(', ') || '-');

  for (const f of missing) {
    const j = await getJson(
      `https://api.github.com/repos/Starryeeeeee/${t.repo}/contents/${t.dir}/${f}`,
    );
    fs.writeFileSync(path.join(t.out, f), Buffer.from(j.content, 'base64'));
    console.log('  filled', f, j.size, 'bytes');
    await sleep(400);
  }
}
console.log('FILL DONE');
