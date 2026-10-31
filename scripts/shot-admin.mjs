// 无头 Edge CDP 截图（自检用，用完即删）
// 用法: node shot.mjs <fileUrl> <outDir> [label]
import { writeFile, mkdir } from 'node:fs/promises';

const PORT = 9222;
const [fileUrl, outDir, label = 'shot'] = process.argv.slice(2);
await mkdir(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageTarget() {
  // 直接新建一个标签打开目标页，避免连到 Edge 首次运行/新标签页
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(
        `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(fileUrl)}`,
        { method: 'PUT' },
      );
      if (res.ok) {
        const t = await res.json();
        if (t.webSocketDebuggerUrl) return t;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error('无法创建 CDP target');
}

const target = await pageTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send('Page.enable');
await send('Runtime.enable');

// 公共前置：去掉首屏加载层与入场动画遮挡；并移除页面脚本，防止它把面板状态改回去
const PRE = `
  document.getElementById('page-loader')?.remove();
  document.documentElement.classList.add('pl-skip');
  document.documentElement.classList.remove('anim');
  document.querySelectorAll('script').forEach(s => s.remove());
`;

// 等页面真正加载完（否则注入会落在 about:blank 上，随后被真实页面覆盖）
async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await send('Runtime.evaluate', {
        expression: `document.readyState === 'complete' && !!document.querySelector('.admin-body')`,
        returnByValue: true,
      });
      if (r.result.value === true) return true;
    } catch {}
    await sleep(250);
  }
  return false;
}

async function shot(name, width, height, setupJs) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 2, mobile: false,
  });
  const ok = await waitReady();
  if (!ok) console.warn(`  [warn] ${name}: 页面未就绪`);
  await send('Runtime.evaluate', { expression: PRE + setupJs, awaitPromise: false });
  await sleep(500);
  await send('Runtime.evaluate', { expression: setupJs, awaitPromise: false });
  await sleep(1200);
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const buf = Buffer.from(data, 'base64');
  const out = `${outDir}/${name}.png`;
  await writeFile(out, buf);
  // 校验 PNG 尺寸
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  console.log(`${out}  ${buf.length} bytes  ${w}x${h}`);
}

// ---- 场景 1：AI 助手（对话）
await shot(`${label}-ai`, 1440, 1000, `(() => {
  document.querySelector('.admin-login')?.setAttribute('hidden','');
  const b = document.querySelector('.admin-body'); if (b) b.removeAttribute('hidden');
  document.querySelectorAll('.admin-panel').forEach(p => {
    if (p.dataset.panel === 'ai') p.removeAttribute('hidden'); else p.setAttribute('hidden','');
  });
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'ai'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'ai'));
  const chat = document.querySelector('[data-ai-chat]');
  if (chat) {
    chat.hidden = false;
    chat.innerHTML = \`
      <div class="ai-turn user"><span class="ai-role">你</span>
        <div class="ai-msg user">帮我把「今天把知识库的搜索做出来了」润色成一条废话条</div></div>
      <div class="ai-turn bot"><span class="ai-role">星渚</span>
        <div class="ai-msg bot md"><p>今天把知识库的搜索做出来了——按科目筛完还能直接搜关键词，<strong>省了翻目录的时间</strong>。</p>
        <ul><li>顺手补了 PDF 预览</li><li>手机上看笔记不用再下载</li></ul></div>
        <div class="ai-src">参考：<a href="#">《知识库使用指南》</a>、《我做的第一个正经小工具：班费公开平台》</div></div>
      <div class="ai-turn bot"><span class="ai-role">星渚</span>
        <div class="ai-msg bot thinking">思考中<span class="ai-dots"><i></i><i></i><i></i></span></div></div>\`;
  }
  const pill = document.querySelector('[data-ai="model-pill"]'); if (pill) pill.textContent = '◉ 星渚';
  const sel = document.querySelector('[data-ai="session"]');
  if (sel) { sel.innerHTML = '<option>润色废话条 · 星渚</option>'; sel.value = '润色废话条 · 星渚'; }
  const think = document.querySelector('[data-ai="think"]'); if (think) think.checked = true;
})()`);

// ---- 场景 2：模型配置
await shot(`${label}-model`, 1440, 1000, `(() => {
  document.querySelector('.admin-login')?.setAttribute('hidden','');
  const b = document.querySelector('.admin-body'); if (b) b.removeAttribute('hidden');
  document.querySelectorAll('.admin-panel').forEach(p => {
    if (p.dataset.panel === 'aimodel') p.removeAttribute('hidden'); else p.setAttribute('hidden','');
  });
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'aimodel'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'aimodel'));
  const wrap = document.querySelector('[data-ai="profiles"]');
  if (wrap) {
    wrap.innerHTML = \`
      <span class="ai-profile-chip active"><button class="ai-profile-name">◉ 星渚（Stellula-2.5）</button><button class="ai-profile-del">✕</button></span>
      <span class="ai-profile-chip"><button class="ai-profile-name">曜魄（Sidera-3.0）</button><button class="ai-profile-del">✕</button></span>
      <span class="ai-profile-chip"><button class="ai-profile-name">云渚（Nubifer-4.1）</button><button class="ai-profile-del">✕</button></span>\`;
  }
  const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.value = val; };
  set('[data-ai="name"]', '星渚（Stellula-2.5）');
  set('[data-ai="baseUrl"]', 'https://api.agnes-ai.cn/v1');
  set('[data-ai="model"]', 'agnes-2.5-flash');
  set('[data-ai="apiKey"]', 'sk-••••••••••••');
  const ps = document.querySelector('[data-ai="preset"]');
  if (ps) { ps.innerHTML = '<option>Agnes</option>'; ps.value = 'Agnes'; }
})()`);

// ---- 场景 3：窄屏（手机）
await shot(`${label}-mobile`, 390, 844, `(() => {
  document.querySelector('.admin-login')?.setAttribute('hidden','');
  const b = document.querySelector('.admin-body'); if (b) b.removeAttribute('hidden');
  document.querySelectorAll('.admin-panel').forEach(p => {
    if (p.dataset.panel === 'ai') p.removeAttribute('hidden'); else p.setAttribute('hidden','');
  });
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'ai'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'ai'));
  const chat = document.querySelector('[data-ai-chat]');
  if (chat) {
    chat.hidden = false;
    chat.innerHTML = \`<div class="ai-turn user"><span class="ai-role">你</span><div class="ai-msg user">总结一下我网站上都有什么</div></div>
      <div class="ai-turn bot"><span class="ai-role">曜魄</span><div class="ai-msg bot md"><p>三类内容：<strong>文章</strong>、<strong>知识库</strong>、<strong>废话条</strong>，外加作品与画廊。</p></div></div>\`;
  }
  const pill = document.querySelector('[data-ai="model-pill"]'); if (pill) pill.textContent = '◉ 曜魄';
})()`);

ws.close();
console.log('done');
