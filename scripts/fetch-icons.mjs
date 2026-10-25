// fetch-icons.mjs — 从 Iconify 拉取开源 SVG 图标，落到 src/icons/ 三个子目录
// 用法：node scripts/fetch-icons.mjs
// 想加图标：去 https://icon-sets.iconify.design 搜到名字，往下面清单里添一行再跑一次即可。
// 注意许可证：social/ 全是 CC0；hand/ 和 ui/ 各自的 license 已写进每个文件头部注释和 README。

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT_ROOT = fileURLToPath(new URL('../src/icons/', import.meta.url));

// cat: 子目录 · set: Iconify 图标集前缀 · icon: 图标名 · file: 落地文件名 · license/source: 写入文件头注释
const ICONS = [
  // ---------- 社交品牌 · Simple Icons（CC0，单色 currentColor，自动跟随明暗主题） ----------
  { cat: 'social', set: 'simple-icons', icon: 'github', file: 'github.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'bilibili', file: 'bilibili.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'neteasecloudmusic', file: 'netease-cloud-music.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'microsoftoutlook', file: 'outlook.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'wechat', file: 'wechat.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'qq', file: 'qq.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'zhihu', file: 'zhihu.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'telegram', file: 'telegram.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'discord', file: 'discord.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'youtube', file: 'youtube.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'steam', file: 'steam.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'x', file: 'x.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'instagram', file: 'instagram.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'spotify', file: 'spotify.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'tiktok', file: 'tiktok.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'gmail', file: 'gmail.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'gitlab', file: 'gitlab.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'mastodon', file: 'mastodon.svg', license: 'CC0', source: 'Simple Icons' },
  { cat: 'social', set: 'simple-icons', icon: 'rss', file: 'rss.svg', license: 'CC0', source: 'Simple Icons' },

  // ---------- 招手 · 多种开源风格任选（线条 / 彩色 emoji / 单色） ----------
  { cat: 'hand', set: 'ph', icon: 'hand-waving', file: 'wave-phosphor.svg', license: 'MIT', source: 'Phosphor Icons' },
  { cat: 'hand', set: 'ph', icon: 'hand-waving-fill', file: 'wave-phosphor-fill.svg', license: 'MIT', source: 'Phosphor Icons' },
  { cat: 'hand', set: 'ph', icon: 'hand-waving-bold', file: 'wave-phosphor-bold.svg', license: 'MIT', source: 'Phosphor Icons' },
  { cat: 'hand', set: 'ph', icon: 'hand-waving-duotone', file: 'wave-phosphor-duotone.svg', license: 'MIT', source: 'Phosphor Icons' },
  { cat: 'hand', set: 'fluent', icon: 'hand-wave-24-regular', file: 'wave-fluent.svg', license: 'MIT', source: 'Fluent System Icons' },
  { cat: 'hand', set: 'fluent-emoji-flat', icon: 'waving-hand', file: 'wave-fluent-emoji-flat.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'hand', set: 'fluent-emoji-high-contrast', icon: 'waving-hand', file: 'wave-fluent-emoji-hc.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'hand', set: 'twemoji', icon: 'waving-hand', file: 'wave-twemoji.svg', license: 'CC-BY 4.0', source: 'Twemoji' },
  { cat: 'hand', set: 'openmoji', icon: 'waving-hand', file: 'wave-openmoji.svg', license: 'CC BY-SA 4.0', source: 'OpenMoji' },

  // ---------- 友好笑脸 · Fluent Emoji（MIT）彩色 + 单色高对比 ----------
  { cat: 'friendly', set: 'fluent-emoji-flat', icon: 'grinning-face', file: 'smile-grin.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-flat', icon: 'slightly-smiling-face', file: 'smile-slight.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-flat', icon: 'smiling-face-with-smiling-eyes', file: 'smile-eyes.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-flat', icon: 'smiling-face-with-hearts', file: 'smile-hearts.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-flat', icon: 'star-struck', file: 'smile-star-struck.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-flat', icon: 'sun-with-face', file: 'smile-sun.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-flat', icon: 'smiling-face-with-halo', file: 'smile-halo.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-flat', icon: 'hugging-face', file: 'smile-hug.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-high-contrast', icon: 'slightly-smiling-face', file: 'smile-slight-hc.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-high-contrast', icon: 'smiling-face-with-smiling-eyes', file: 'smile-eyes-hc.svg', license: 'MIT', source: 'Fluent Emoji' },
  { cat: 'friendly', set: 'fluent-emoji-high-contrast', icon: 'smiling-face-with-hearts', file: 'smile-hearts-hc.svg', license: 'MIT', source: 'Fluent Emoji' },

  // ---------- 界面小图标 · Lucide（ISC，线条风，和站内 RSS 图标同一家的风格） ----------
  { cat: 'ui', set: 'lucide', icon: 'mail', file: 'mail.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'sun', file: 'sun.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'moon', file: 'moon.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'moon-star', file: 'moon-star.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'arrow-up-right', file: 'arrow-up-right.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'external-link', file: 'external-link.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'calendar', file: 'calendar.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'clock', file: 'clock.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'folder', file: 'folder.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'file-text', file: 'file-text.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'search', file: 'search.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'heart', file: 'heart.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'star', file: 'star.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'sparkles', file: 'sparkles.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'rocket', file: 'rocket.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'send', file: 'send.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'rss', file: 'rss.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'pen-line', file: 'pen-line.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'globe', file: 'globe.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'music', file: 'music.svg', license: 'ISC', source: 'Lucide' },
  { cat: 'ui', set: 'lucide', icon: 'play', file: 'play.svg', license: 'ISC', source: 'Lucide' },
];

let ok = 0;
let fail = 0;

for (const { cat, set, icon, file, license, source } of ICONS) {
  const url = `https://api.iconify.design/${set}/${icon}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[FAIL] ${cat}/${file}  ${set}:${icon}  HTTP ${res.status}`);
      fail++;
      continue;
    }
    let svg = (await res.text()).trim();
    if (!svg.startsWith('<svg')) {
      console.log(`[FAIL] ${cat}/${file}  ${set}:${icon}  返回的不是 SVG`);
      fail++;
      continue;
    }
    const comment = `<!-- ${file.replace(/\.svg$/, '')} · ${source} (${license}) · https://icon-sets.iconify.design/${set}/${icon} -->\n`;
    const dir = `${OUT_ROOT}${cat}`;
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/${file}`, comment + svg + '\n', 'utf8');
    console.log(`[ok]   ${cat}/${file}`);
    ok++;
  } catch (err) {
    console.log(`[FAIL] ${cat}/${file}  ${set}:${icon}  ${err.message}`);
    fail++;
  }
}

console.log(`\n完成：成功 ${ok} 个，失败 ${fail} 个。`);
