/**
 * 星野漫游 · 文件上传服务（Cloudflare Worker + R2）
 *
 * 作用：让 /admin 后台把图片和文档直接存进 Cloudflare R2，
 * 文件本体不再进 Git 仓库（GitHub Pages 仓库只留元数据清单）。
 *
 * 接口：
 * - POST /upload          上传文件（raw body = 文件字节，文件名等元数据走请求头）
 * - DELETE /object?key=…  删除对象（删除内容时同步清理、或上传后清单写失败时清孤儿）
 * - GET /health           自检（返回是否已绑定 R2 桶）
 *
 * 安全设计（对应《改进计划》P5.4）：
 * - 授权：优先用站主的 GitHub PAT 校验（Worker 调 GitHub /user 确认身份），
 *   也支持单独设置 UPLOAD_KEY secret 二选一；未授权一律拒绝，不提供匿名写入。
 * - R2 凭证用 **binding**（env.FILES），不是 secret：浏览器、仓库、构建产物里
 *   根本不存在凭证，比放在 Secret 里更不容易外泄。
 * - 对象名一律服务端生成（kind/时间戳-随机串.扩展名），绝不采用客户端文件名，
 *   避免路径穿越、覆盖同名、注入扩展名。
 * - 类型白名单 + 体积上限，**按实际读到的字节数判定**，不信请求头里的 Content-Length。
 * - 速率限制：每 IP 每小时 60 次（内存计数，够个人站用）。
 * - CORS 只放行站点来源（env.ALLOWED_ORIGINS），其他来源的响应不带 CORS 头。
 *
 * 部署：见同目录 README.md。
 */

const DEFAULTS = {
  /** 知识库文档上限 40MB（与原 GitHub 上传一致） */
  maxKbBytes: 40 * 1024 * 1024,
  /** 画廊图片上限 12MB */
  maxGalleryBytes: 12 * 1024 * 1024,
  /** 每 IP 每小时请求数 */
  ratePerHour: 60,
  /** 允许上传的 GitHub 用户名 */
  allowedLogin: 'Starryeeeeee',
  /** 允许发起请求的来源 */
  allowedOrigins: ['https://starryeeeeee.github.io', 'http://localhost:4321', 'http://127.0.0.1:4321'],
};

/** 两种用途各自的类型/体积白名单 */
const KIND_RULES = {
  kb: {
    maxBytes: DEFAULTS.maxKbBytes,
    types: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/markdown',
      'text/plain',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'image/avif',
    ],
    exts: [
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
      'md', 'markdown', 'txt', 'csv',
      'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif',
    ],
  },
  gallery: {
    maxBytes: DEFAULTS.maxGalleryBytes,
    types: ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'],
    exts: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif'],
  },
} as const;

/** 内存限流：Worker 实例生命周期内有效（重启清零，够用） */
const rate = new Map<string, { n: number; reset: number }>();

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const list = (env.ALLOWED_ORIGINS || DEFAULTS.allowedOrigins.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed = origin && list.includes(origin) ? origin : list[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, DELETE, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Upload-Key, X-File-Kind, X-File-Name',
    'Access-Control-Max-Age': '43200',
    Vary: 'Origin',
  };
}

function json(status: number, body: unknown, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function limited(ip: string, env: Env): boolean {
  const max = Number(env.RATE_PER_HOUR || DEFAULTS.ratePerHour);
  const now = Date.now();
  const rec = rate.get(ip);
  if (!rec || now > rec.reset) {
    rate.set(ip, { n: 1, reset: now + 3600_000 });
    return false;
  }
  rec.n += 1;
  return rec.n > max;
}

/**
 * 授权：站主身份二选一
 * 1) UPLOAD_KEY secret + X-Upload-Key 头（不想把 PAT 交给 Worker 时用）
 * 2) GitHub PAT + Authorization: Bearer（默认；Worker 向 GitHub 核实这串令牌属于谁）
 */
async function authorize(request: Request, env: Env): Promise<{ ok: boolean; status: number; error: string }> {
  const uploadKey = env.UPLOAD_KEY;
  if (uploadKey) {
    const provided = request.headers.get('X-Upload-Key');
    if (provided && provided === uploadKey) return { ok: true, status: 200, error: '' };
  }

  const pat = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!pat) return { ok: false, status: 401, error: '缺少令牌（登录 /admin 后会自动带上）' };

  let me: { login?: string };
  try {
    const r = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${pat}`, 'User-Agent': 'starry-upload', Accept: 'application/vnd.github+json' },
    });
    if (!r.ok) return { ok: false, status: 401, error: '令牌无效或已过期，重新生成一个' };
    me = (await r.json()) as { login?: string };
  } catch {
    return { ok: false, status: 502, error: '校验令牌时联系不上 GitHub，稍后重试' };
  }

  const allowed = String(env.ALLOWED_GITHUB_LOGIN || DEFAULTS.allowedLogin).toLowerCase();
  if ((me.login || '').toLowerCase() !== allowed) {
    return { ok: false, status: 403, error: `这枚令牌不属于 ${env.ALLOWED_GITHUB_LOGIN || DEFAULTS.allowedLogin}` };
  }
  return { ok: true, status: 200, error: '' };
}

/** 取扩展名：优先看原始文件名，其次看 Content-Type */
function extOf(name: string, contentType: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  if (m) return m[1];
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/markdown': 'md',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  };
  return map[contentType] ?? 'bin';
}

/** 服务端生成对象名：kind/yyyymmdd-hhmmss-随机串.ext */
function makeKey(kind: string, ext: string): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  const stamp = `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `${kind}/${stamp}-${rand}.${ext}`;
}

/** 对象名必须是本服务生成的形态，防止越权删别人的键 */
function validKey(key: string): boolean {
  return /^(kb|gallery)\/\d{8}-\d{6}-[a-f0-9]{10}\.[a-z0-9]{1,8}$/.test(key);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    // —— 自检 ——
    if (url.pathname === '/health') {
      return json(
        200,
        {
          ok: true,
          bucket: !!env.FILES,
          publicBase: env.R2_PUBLIC_BASE || '',
          maxKbBytes: Number(env.MAX_KB_BYTES || DEFAULTS.maxKbBytes),
          maxGalleryBytes: Number(env.MAX_GALLERY_BYTES || DEFAULTS.maxGalleryBytes),
        },
        cors,
      );
    }

    if (!env.FILES) {
      return json(500, { ok: false, error: 'Worker 还没绑定 R2 桶（wrangler.toml 的 r2_buckets）' }, cors);
    }

    const auth = await authorize(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error }, cors);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (limited(ip, env)) {
      return json(429, { ok: false, error: '这个小时的上传次数用完了（每小时 60 次），稍后再来' }, cors);
    }

    // —— 删除对象 ——
    if (url.pathname === '/object') {
      if (request.method !== 'DELETE') {
        return json(405, { ok: false, error: '删除对象请用 DELETE' }, cors);
      }
      const key = url.searchParams.get('key') ?? '';
      if (!validKey(key)) return json(400, { ok: false, error: '对象名不合法' }, cors);
      await env.FILES.delete(key);
      return json(200, { ok: true, key }, cors);
    }

    // —— 上传 ——
    if (url.pathname !== '/upload') {
      return json(404, { ok: false, error: '只支持 POST /upload、DELETE /object、GET /health' }, cors);
    }
    if (request.method !== 'POST') {
      return json(405, { ok: false, error: '上传请用 POST' }, cors);
    }

    const kind = (request.headers.get('X-File-Kind') || '').toLowerCase();
    const rules = (KIND_RULES as Record<string, (typeof KIND_RULES)[keyof typeof KIND_RULES]>)[kind];
    if (!rules) {
      return json(400, { ok: false, error: `未知的文件用途 ${kind || '(空)'}` }, cors);
    }

    const originalName = (request.headers.get('X-File-Name') || '').slice(0, 120);
    const contentType = (request.headers.get('Content-Type') || 'application/octet-stream').split(';')[0].trim().toLowerCase();

    // 类型白名单：Content-Type 必须在名单里；扩展名也必须在名单里
    const ext = extOf(originalName, contentType);
    if (!rules.types.includes(contentType)) {
      return json(415, { ok: false, error: `不支持的文件类型 ${contentType}` }, cors);
    }
    if (!rules.exts.includes(ext)) {
      return json(415, { ok: false, error: `不支持的扩展名 .${ext}` }, cors);
    }

    // 体积：先看请求头做个快速拒绝，真正的判定以实际读到的字节数为准
    const declared = Number(request.headers.get('Content-Length') || '0');
    const maxBytes = kind === 'gallery' ? Number(env.MAX_GALLERY_BYTES || rules.maxBytes) : Number(env.MAX_KB_BYTES || rules.maxBytes);
    if (declared && declared > maxBytes) {
      return json(413, { ok: false, error: `文件超过上限（${Math.round(maxBytes / 1024 / 1024)}MB）` }, cors);
    }

    const buf = await request.arrayBuffer();
    const size = buf.byteLength;
    if (size === 0) return json(400, { ok: false, error: '文件是空的' }, cors);
    if (size > maxBytes) {
      return json(413, { ok: false, error: `文件超过上限（${Math.round(maxBytes / 1024 / 1024)}MB，实际 ${Math.round(size / 1024 / 1024)}MB）` }, cors);
    }

    const key = makeKey(kind, ext);
    await env.FILES.put(key, buf, {
      httpMetadata: { contentType },
      customMetadata: { originalName: originalName || key, kind, size: String(size) },
    });

    const base = (env.R2_PUBLIC_BASE || '').replace(/\/+$/, '');
    return json(
      200,
      {
        ok: true,
        key,
        url: base ? `${base}/${key}` : '',
        size,
        type: contentType,
        name: originalName,
      },
      cors,
    );
  },
};

interface Env {
  /** 绑定的 R2 桶（binding，不是 secret——凭证不落在任何配置文件里） */
  FILES?: R2Bucket;
  /** R2 公开访问地址，如 https://files.<子域>.r2.dev 或自定义域名 */
  R2_PUBLIC_BASE?: string;
  /** 允许上传的 GitHub 用户名 */
  ALLOWED_GITHUB_LOGIN?: string;
  /** 允许的来源，逗号分隔 */
  ALLOWED_ORIGINS?: string;
  /** 备选授权：单独的上传密钥（设了就优先用它，不必把 PAT 给 Worker） */
  UPLOAD_KEY?: string;
  /** 知识库文件上限（字节） */
  MAX_KB_BYTES?: string;
  /** 画廊图片上限（字节） */
  MAX_GALLERY_BYTES?: string;
  /** 每 IP 每小时请求数 */
  RATE_PER_HOUR?: string;
}
