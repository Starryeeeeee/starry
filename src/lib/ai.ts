/**
 * AI 能力接入层：OpenAI 兼容对话接口 + 站内资料检索。
 *
 * 设计要点：
 * - 全站没有服务器，AI 请求从浏览器直接发往模型服务商（已验证 Agnes 允许 CORS 跨域）。
 *   因此 API Key 只存在站长浏览器 localStorage（与 PAT 同级的信任边界），绝不进仓库。
 *   将来要对访客开放 AI 功能，再加一层代理（Supabase Edge Function / Cloudflare Worker），
 *   届时只需把 baseUrl 填成代理地址，本层代码不用动。
 * - 服务商只要求「OpenAI 兼容」，换 DeepSeek / 智谱等 = 在 /admin 里改三个配置项。
 * - 资料问答的检索是轻量关键词打分（标题/标签/正文加权），索引来自构建时生成的
 *   /api-index.json（见 src/pages/api-index.json.ts），不依赖向量库。
 */

export type AiConfig = {
  /** OpenAI 兼容 base URL，如 https://api.agnes-ai.cn/v1（不带尾部斜杠也能处理） */
  baseUrl: string;
  model: string;
  apiKey: string;
  /** 深度思考的三种实现（因服务商而异，按预设自动带上）：
   *  - thinkingModel：换用专门的思考模型（如 DeepSeek 的 deepseek-reasoner）
   *  - thinkingKwargs：同一模型开请求开关（Agnes/Qwen 系 chat_template_kwargs.enable_thinking）
   *  - thinkingParam：thinking.type 开关（智谱 GLM 系） */
  thinkingModel?: string;
  thinkingKwargs?: boolean;
  thinkingParam?: boolean;
  /** 服务端原生联网搜索（智谱 GLM 的 web_search 工具），开了就走它，不走浏览器中转 */
  webSearchTool?: boolean;
};

export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** 常用服务商预设：选一下自动填 baseUrl 和模型名 */
export const AI_PRESETS: Array<{
  key: string;
  label: string;
  baseUrl: string;
  model: string;
  note: string;
  thinkingModel?: string;
  thinkingKwargs?: boolean;
  thinkingParam?: boolean;
  webSearchTool?: boolean;
}> = [
  {
    key: 'agnes',
    label: 'Agnes（免费测试用）',
    baseUrl: 'https://api.agnes-ai.cn/v1',
    model: 'agnes-2.5-flash',
    note: '免费档，适合先把功能跑起来。深度思考可用；联网搜索走公共中转，尽力而为不稳定。',
    thinkingKwargs: true,
  },
  {
    key: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    note: '国内直连、价格低，适合正式使用；在 platform.deepseek.com 申请 key。联网搜索同样走公共中转。',
    thinkingModel: 'deepseek-reasoner',
  },
  {
    key: 'zhipu',
    label: '智谱 GLM（联网搜索最稳）',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-5.3-flash',
    note: '服务端原生联网搜索，稳定可靠；WorkBuddy 里配的智谱 key 直接可用，或去 bigmodel.cn 申请。深度思考/快速模式都支持。',
    thinkingParam: true,
    webSearchTool: true,
  },
  {
    key: 'custom',
    label: '自定义（任意 OpenAI 兼容接口）',
    baseUrl: '',
    model: '',
    note: '任何兼容 OpenAI /chat/completions 的服务都行，填 baseUrl + 模型名 + key。深度思考/联网搜索开关对自定义服务商不一定生效。',
  },
];

const STORAGE_KEY = 'sr-ai-config';

export function loadAiConfig(): AiConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as AiConfig;
    if (!cfg.baseUrl || !cfg.model || !cfg.apiKey) return null;
    return cfg;
  } catch {
    return null;
  }
}

export function saveAiConfig(cfg: AiConfig) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      baseUrl: cfg.baseUrl.replace(/\/+$/, ''),
      model: cfg.model.trim(),
      apiKey: cfg.apiKey.trim(),
      thinkingModel: cfg.thinkingModel?.trim() || undefined,
      thinkingKwargs: cfg.thinkingKwargs || undefined,
      thinkingParam: cfg.thinkingParam || undefined,
      webSearchTool: cfg.webSearchTool || undefined,
    }),
  );
}

export function clearAiConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 调对话接口（非流式，站点数据量小、回复短，流式收益不大反而多一套解析）。
 * 出错时抛出带可读信息的 Error，调用方直接展示 message 即可。
 */
export async function aiChat(
  cfg: AiConfig,
  messages: AiMessage[],
  opts: {
    temperature?: number;
    maxTokens?: number;
    thinking?: boolean;
    /** 开联网搜索：有原生工具的服务商走服务端搜索，否则调用方自己先搜好注入上下文 */
    webSearch?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<string> {
  // 深度思考按服务商能力三选一：换思考模型 / 开请求参数 / thinking.type 开关
  const useThinking = !!opts.thinking;
  const model = useThinking && cfg.thinkingModel ? cfg.thinkingModel : cfg.model;
  const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      ...(useThinking && cfg.thinkingKwargs
        ? { chat_template_kwargs: { enable_thinking: true } }
        : {}),
      ...(cfg.thinkingParam ? { thinking: { type: useThinking ? 'enabled' : 'disabled' } } : {}),
      ...(opts.webSearch && cfg.webSearchTool
        ? { tools: [{ type: 'web_search', web_search: { enable: true } }] }
        : {}),
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    const detail = body?.error?.message ?? res.statusText;
    throw new Error(`AI 接口返回 ${res.status}：${detail}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('AI 返回了空内容');
  return text;
}

/** 连通性测试：发一句最小请求，能对上话就说明 base URL / 模型名 / key 都对 */
export async function aiTestConnection(cfg: AiConfig): Promise<string> {
  return aiChat(cfg, [{ role: 'user', content: '请只回复两个字：收到' }], { maxTokens: 200 });
}

// ---------------- 站内资料检索 ----------------

/** /api-index.json 里单条内容的形状（与 api-index.json.ts 保持一致） */
export type AiIndexEntry = {
  id?: string;
  /** post 文章 / kb-note 知识库笔记 / kb-file 知识库文档 / moment 废话条 */
  type: 'post' | 'kb-note' | 'kb-file' | 'moment';
  title: string;
  /** 站内路径（不带 base 前缀，展示时用 u() 包一下），废话条没有 */
  path?: string;
  date?: string;
  tags?: string[];
  subject?: string;
  description?: string;
  /** 纯文本正文（截断过），kb-file 类只有元数据没有正文 */
  content?: string;
};

const TYPE_LABEL: Record<AiIndexEntry['type'], string> = {
  post: '文章',
  'kb-note': '知识库笔记',
  'kb-file': '知识库文档',
  moment: '废话条',
};

export const indexTypeLabel = (t: AiIndexEntry['type']) => TYPE_LABEL[t];

/** 提取检索词：英文按空格拆词，中文拆成二元组（bigram）——无分词库时最实用的折中 */
function tokenize(query: string): string[] {
  const tokens = new Set<string>();
  for (const chunk of query.toLowerCase().split(/[\s，。！？、,.!?;；:：'"“”()（）\[\]【】]+/)) {
    if (!chunk) continue;
    if (/^[\x20-\x7e]+$/.test(chunk)) {
      tokens.add(chunk);
      continue;
    }
    const cjk = chunk.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '');
    if (cjk.length <= 2) {
      tokens.add(cjk);
    } else {
      for (let i = 0; i < cjk.length - 1; i++) tokens.add(cjk.slice(i, i + 2));
    }
  }
  return [...tokens].filter((t) => t.length > 0);
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

/**
 * 关键词打分检索：标题命中权重最高，标签/科目次之，再次摘要，正文最低。
 * 返回按得分降序的前 top 条（得分为 0 的不返回）。
 */
export function searchIndex(
  entries: AiIndexEntry[],
  query: string,
  top = 5,
): Array<{ entry: AiIndexEntry; score: number }> {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const scored = entries.map((entry) => {
    const title = (entry.title ?? '').toLowerCase();
    const tags = (entry.tags ?? []).join(' ').toLowerCase();
    const subject = (entry.subject ?? '').toLowerCase();
    const desc = (entry.description ?? '').toLowerCase();
    const content = (entry.content ?? '').toLowerCase();
    let score = 0;
    for (const tk of tokens) {
      score += countOccurrences(title, tk) * 6;
      score += countOccurrences(tags, tk) * 4;
      score += countOccurrences(subject, tk) * 4;
      score += countOccurrences(desc, tk) * 2;
      score += countOccurrences(content, tk);
    }
    return { entry, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

/** 把检索命中的条目拼成注入 system prompt 的资料块 */
export function buildContextBlock(hits: Array<{ entry: AiIndexEntry }>): string {
  if (!hits.length) return '';
  return hits
    .map(({ entry }, i) => {
      const head = [
        `【${i + 1}】${TYPE_LABEL[entry.type]}：${entry.title}`,
        entry.date ? `日期：${entry.date}` : null,
        entry.subject ? `科目：${entry.subject}` : null,
        entry.tags?.length ? `标签：${entry.tags.join('、')}` : null,
        entry.description ? `简介：${entry.description}` : null,
        entry.path ? `链接：${entry.path}` : null,
      ]
        .filter(Boolean)
        .join('｜');
      return entry.content ? `${head}\n${entry.content}` : head;
    })
    .join('\n\n---\n\n');
}

// ---------------- 联网搜索 ----------------
// 两家测试/正式服务商都不内置搜索，这里用「CORS 开放的公共中转 + 必应搜索页」实现，
// 浏览器直连、无需任何搜索 API key。中转按可用性逐个回退，全挂了就抛错，
// 调用方（admin）会降级为"仅基于站内资料回答"，不会阻塞对话。

export type WebResult = { title: string; url: string; snippet: string };

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

const stripTags = (s: string) => decodeEntities(s.replace(/<[^>]*>/g, '')).trim();

/** 解析必应 RSS 输出（<item><title><link><description>），首选通道 */
function parseBingRss(xml: string): WebResult[] {
  const out: WebResult[] = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const item of items) {
    const t = item.match(/<title>([\s\S]*?)<\/title>/);
    const l = item.match(/<link>([\s\S]*?)<\/link>/);
    const d = item.match(/<description>([\s\S]*?)<\/description>/);
    const url = l ? decodeEntities(l[1].trim()) : '';
    const title = t ? stripTags(t[1]) : '';
    if (!/^https?:\/\//.test(url) || !title) continue;
    if (/bing\.com\b/.test(url)) continue; // 跳过必应自己的聚合页
    out.push({ title, url, snippet: d ? stripTags(d[1]).slice(0, 300) : '' });
  }
  return out;
}

/** 解析必应网页版 HTML（li.b_algo 结构），RSS 不可用时的兜底 */
function parseBingHtml(html: string): WebResult[] {
  const out: WebResult[] = [];
  const items = html.match(/<li class="b_algo[\s\S]*?<\/li>/g) ?? [];
  for (const item of items) {
    const a = item.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!a) continue;
    const url = decodeEntities(a[1]);
    const title = stripTags(a[2]);
    if (!/^https?:\/\//.test(url) || !title) continue;
    const snip = item.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    out.push({ title, url, snippet: snip ? stripTags(snip[1]).slice(0, 300) : '' });
  }
  return out;
}

const BING_TIMEOUT = 15000;

/**
 * 必应搜索结果的取回通道：用 CORS 开放的公共中转带走 cn.bing.com 的 RSS 输出
 * （浏览器直连必应会被 CORS 拦，中转免费但质量参差，逐个回退 + 二轮重试）。
 * r.jina.ai 在站主电脑开着系统代理时可用，平时可能超时。
 */
const BING_RELAYS = [
  (url: string) => `https://api.cors.lol/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://r.jina.ai/${url}`,
];

async function fetchBingViaRelays(bingUrl: string, signal?: AbortSignal): Promise<string> {
  const errors: string[] = [];
  for (let round = 0; round < 2; round++) {
    for (const wrap of BING_RELAYS) {
      try {
        const r = await fetch(wrap(bingUrl), { signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        if (/<item>/.test(text) || /b_algo/.test(text)) return text;
        throw new Error('返回内容不是搜索结果');
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    if (round === 0) await new Promise((res) => setTimeout(res, 3000)); // 稍等再试一轮
  }
  throw new Error(errors.slice(-4).join('；'));
}

/** 联网搜索：返回前 n 条网页结果；所有通道都失败时抛错 */
export async function webSearch(query: string, n = 6, signal?: AbortSignal): Promise<WebResult[]> {
  const bingUrl = `https://cn.bing.com/search?q=${encodeURIComponent(query)}&format=rss&mkt=zh-CN&count=10`;
  const body = await fetchBingViaRelays(bingUrl, signal);
  const seen = new Set<string>();
  const results: WebResult[] = [];
  for (const r of [...parseBingRss(body), ...parseBingHtml(body)]) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    results.push(r);
    if (results.length >= n) break;
  }
  if (!results.length) throw new Error('搜索结果解析为空（搜索引擎可能改版了）');
  return results;
}

/** 把联网搜索结果拼成注入 system prompt 的资料块 */
export function buildWebBlock(results: WebResult[]): string {
  if (!results.length) return '';
  return results
    .map(
      (r, i) =>
        `【网${i + 1}】${r.title}\n链接：${r.url}${r.snippet ? `\n摘要：${r.snippet}` : ''}`,
    )
    .join('\n\n');
}
