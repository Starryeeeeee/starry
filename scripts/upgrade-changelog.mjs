// 建站日志：年分组 → 年+月两级分组（按行定位，兼容 CRLF）
import fs from 'node:fs';
const p = 'src/pages/changelog.astro';
let lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);

function findLine(pred, from = 0) {
  for (let i = from; i < lines.length; i++) if (pred(lines[i])) return i;
  return -1;
}

// 1) 替换分组逻辑块（注释行 → 对应的 "}" 收尾行）
const gStart = findLine((l) => l.includes('按年份分组'));
const gEnd = findLine((l) => l.trim() === '}', gStart);
if (gStart === -1 || gEnd === -1) {
  console.log('group block not found');
  process.exit(1);
}
const newGroup = [
  '// 按「年 → 月」两级分组：改动频繁，只按年分段不够用',
  '// 年份仍是 antfu 式描边幽灵大字；年份内每个月用小标题分段',
  'const groups: Array<{ year: number; months: Array<{ month: number; items: typeof rendered }> }> = [];',
  'for (const item of rendered) {',
  '  const d = item.entry.data.date;',
  '  const year = d.getFullYear();',
  '  const month = d.getMonth() + 1;',
  '  const g = groups[groups.length - 1];',
  '  if (g && g.year === year) {',
  '    const m = g.months[g.months.length - 1];',
  '    if (m && m.month === month) m.items.push(item);',
  '    else g.months.push({ month, items: [item] });',
  '  } else {',
  '    groups.push({ year, months: [{ month, items: [item] }] });',
  '  }',
  '}',
];
lines.splice(gStart, gEnd - gStart + 1, ...newGroup);

// 2) 模板：月份 map 包裹
const tStart = findLine((l) => l.includes('class="tl-year reveal"'));
const tOpen = findLine((l) => l.includes('{groups.map((group) => ('), 0);
const afterYear = findLine((l) => l.includes('aria-hidden="true">{group.year}'));
const itemsLine = findLine((l) => l.includes('group.items.map(({ entry, Content }, i)'), afterYear);
if (itemsLine === -1) {
  console.log('items line not found');
  process.exit(1);
}
// 在 {group.items.map(...) 行前插入月份标题行 + 开一层 map
lines.splice(itemsLine, 0,
  '          <div class="tl-month reveal" aria-hidden="true">{month}月</div>',
  '          {monthItems.map(({ entry, Content }, i) => (',
);

// 把外层 {group.items.map(...)} 替换为月份 map
const outer = findLine((l) => l.includes('group.items.map(({ entry, Content }, i)'));
if (outer === -1) {
  console.log('outer map not found');
  process.exit(1);
}
// 外层行当前是 group.items.map —— 改为解构月份，并记住需要闭合
// 简化：直接在模板重构时用变量 monthItems，在 groups.map 里先解构
// 重新读取确认当前行
lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
const outerIdx = lines.findIndex((l) => l.includes('{group.items.map(({ entry, Content }, i)'));
if (outerIdx !== -1) {
  lines[outerIdx] = lines[outerIdx].replace(
    '{group.items.map(({ entry, Content }, i) => (',
    '{monthItems.map(({ entry, Content }, i) => (',
  );
}

// 3) 找到该 map 的收尾 "))" 行，在其后补月份 map 的闭合 "))}
//    （月份 map 在外层 groups.map 内，收尾在对应 </> 之前）
const closeIdx = findLine((l) => l.trim() === '))}', outerIdx);
if (closeIdx === -1) {
  console.log('close of month map not found');
  process.exit(1);
}
lines.splice(closeIdx + 1, 0, '          ))}');

// 4) groups.map 解构出 monthItems
const gMapIdx = lines.findIndex((l) => l.includes('{groups.map((group) => ('));
if (gMapIdx !== -1) {
  lines[gMapIdx] = lines[gMapIdx].replace(
    '{groups.map((group) => (',
    '{groups.map(({ year, monthItems }) => (',
  );
  const yearIdx = lines.findIndex((l) => l.includes('{year}月') || l.includes('>{group.year}<'));
  if (yearIdx !== -1) lines[yearIdx] = lines[yearIdx].split('{group.year}').join('{year}');
}

// 5) 样式：月份小标题 + 移动端对齐
const styleIdx = lines.findIndex((l) => l.trim() === '.tl-year {');
if (styleIdx !== -1) {
  lines.splice(styleIdx, 0,
    '  .tl-month {',
    '    position: relative;',
    '    z-index: 1;',
    "    margin: 26px 0 0 118px;",
    '    font-family: var(--font-display-cn);',
    '    font-weight: 400;',
    '    font-size: 1.15rem;',
    '    color: var(--accent-ink);',
    '    letter-spacing: 0.04em;',
    '  }',
    '',
  );
}
const mobIdx = lines.findIndex((l) => l.includes('margin-left: 30px'));
if (mobIdx !== -1) {
  lines.splice(mobIdx + 3, 0, '', '    .tl-month {', '      margin-left: 30px;', '    }');
}

fs.writeFileSync(p, lines.join('\n'));
console.log('changelog upgraded to year+month grouping');
