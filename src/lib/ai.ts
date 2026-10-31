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
};

export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** 常用服务商预设：选一下自动填 baseUrl 和模型名 */
export const AI_PRESETS: Array<{
  key: string;
  label: string;
  baseUrl: string;
  model: string;
  note: string;
}> = [
  {
    key: 'agnes',
    label: 'Agnes（免费测试用）',
    baseUrl: 'https://api.agnes-ai.cn/v1',
    model: 'agnes-2.5-flash',
    note: '免费档，适合先把功能跑起来；正式使用建议换下面的服务商。',
  },
  {
    key: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    note: '国内直连、价格低，适合正式使用；在 platform.deepseek.com 申请 key。',
  },
  {
    key: 'custom',
    label: '自定义（任意 OpenAI 兼容接口）',
    baseUrl: '',
    model: '',
    note: '任何兼容 OpenAI /chat/completions 的服务都行，填 baseUrl + 模型名 + key。',
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
    JSON.stringify({ baseUrl: cfg.baseUrl.replace(/\/+$/, ''), model: cfg.model.trim(), apiKey: cfg.apiKey.trim() }),
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
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): Promise<string> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
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
