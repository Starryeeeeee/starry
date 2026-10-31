/**
 * 星野漫游 · AI 代理（Cloudflare Worker）
 *
 * 作用：让访客在首页挂件里使用 AI，而不用把任何 API Key 暴露在前端。
 * 浏览器 → 本 Worker → 模型服务商（OpenAI 兼容接口，默认 Agnes）。
 *
 * 行为：
 * - 只转发 /v1/chat/completions，其余一律 404；
 * - CORS 全开（挂件从 starryeeeeee.github.io 发起）；
 * - 模型白名单（环境变量 AI_ALLOWED_MODELS，逗号分隔，支持 agnes-* 前缀通配）；
 * - 输出上限（AI_MAX_TOKENS，默认 1500）防滥用；
 * - 每 IP 每小时 30 次（内存计数，Worker 重启即清零，够个人站用）；
 * - 真实密钥存在 Worker 的 Secret（AI_API_KEY），浏览器全程接触不到。
 *
 * 部署：见同目录 README.md。
 */

const DEFAULT_BASE_URL = 'https://api.agnes-ai.cn/v1';
const DEFAULT_MODELS = 'agnes-2.5-flash,agnes-3.0-flash';
const DEFAULT_MAX_TOKENS = 1500;
const RATE_LIMIT = 30; // 每 IP 每小时

// 内存限流：Worker 实例生命周期内有效（重启清零，够用）
const rate = new Map<string, { n: number; reset: number }>();

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '43200',
  };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() },
  });
}

function limited(ip: string): boolean {
  const now = Date.now();
  const rec = rate.get(ip);
  if (!rec || now > rec.reset) {
    rate.set(ip, { n: 1, reset: now + 3600_000 });
    return false;
  }
  rec.n += 1;
  return rec.n > RATE_LIMIT;
}

function modelAllowed(model: string, whitelist: string[]): boolean {
  return whitelist.some((m) => (m.endsWith('*') ? model.startsWith(m.slice(0, -1)) : model === m));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders();
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (url.pathname !== '/v1/chat/completions' || request.method !== 'POST') {
      return json(404, { error: { message: '只支持 POST /v1/chat/completions' } });
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (limited(ip)) {
      return json(429, { error: { message: '这个小时的额度用完了（每小时 30 次），休息一下再来' } });
    }

    const apiKey = env.AI_API_KEY;
    if (!apiKey) {
      return json(500, { error: { message: 'Worker 还没配置 AI_API_KEY（Secret）' } });
    }
    const baseUrl = (env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const whitelist = (env.AI_ALLOWED_MODELS || DEFAULT_MODELS)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const maxTokens = Number(env.AI_MAX_TOKENS || DEFAULT_MAX_TOKENS);

    let payload: {
      model?: string;
      messages?: unknown;
      max_tokens?: number;
      temperature?: number;
      chat_template_kwargs?: Record<string, unknown>;
      thinking?: Record<string, unknown>;
    };
    try {
      payload = await request.json();
    } catch {
      return json(400, { error: { message: '请求体不是合法 JSON' } });
    }

    const model = payload.model ?? '';
    if (!modelAllowed(model, whitelist)) {
      return json(400, { error: { message: `模型 ${model} 不在白名单里（${whitelist.join(', ')}）` } });
    }

    // 转发前收紧输出上限，防滥用；其余字段原样透传
    const outbound = { ...payload, max_tokens: Math.min(payload.max_tokens ?? maxTokens, maxTokens) };

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outbound),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() },
    });
  },
};

interface Env {
  /** 模型服务商的 API Key（Secret，勿写入代码/仓库） */
  AI_API_KEY?: string;
  /** OpenAI 兼容 base URL，默认 Agnes */
  AI_BASE_URL?: string;
  /** 模型白名单，逗号分隔，支持前缀通配（agnes-*） */
  AI_ALLOWED_MODELS?: string;
  /** 单次回复输出上限 */
  AI_MAX_TOKENS?: string;
}
