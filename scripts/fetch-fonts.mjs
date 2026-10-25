// 临时脚本：从 GitHub 拉取用户仓库里的字体子集 result.css
import fs from 'node:fs';

async function get(repo, path, out) {
  const r = await fetch(
    'https://api.github.com/repos/Starryeeeeee/' + repo + '/contents/' + path,
  );
  console.log(repo, path, '->', r.status);
  if (r.status !== 200) {
    console.log(await r.text());
    return;
  }
  const j = await r.json();
  fs.writeFileSync(out, Buffer.from(j.content, 'base64'));
  console.log('saved', out, j.size, 'bytes');
}

(async () => {
  await get('class-fund-disclosure-platform', 'subset/result.css', 'tmp-subset.css');
  await get('truth-or-dare', 'subset-body/result.css', 'tmp-subset-body.css');
  await get('Game1', 'subset-main/result.css', 'tmp-subset-main.css');
})();
