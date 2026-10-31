# 星野漫游 AI 代理（Cloudflare Worker）

让访客在首页右下角的星球挂件里用上 AI，而 API Key 全程不进前端。

```
访客浏览器（挂件） → 本 Worker（注入密钥） → Agnes / DeepSeek 等模型服务商
```

## 方式一：Dashboard 网页部署（推荐，约 5 分钟，不需要本地环境）

1. 打开 dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**，名字填 `starry-ai-proxy`，点 Deploy（先随便部署个模板没关系）。
2. 点 **Edit code**，把本目录 `worker.js` 的全部内容粘进去，替换模板，点右上角 **Deploy**。
3. 配置变量：Worker 页面 → **Settings** → **Variables and Secrets**：
   - **Add → Secret**：名字 `AI_API_KEY`，值粘贴你的模型服务商 API Key（现在用 Agnes 的 `sk-…`）。
   - Secret 之外的三项（`AI_BASE_URL` / `AI_ALLOWED_MODELS` / `AI_MAX_TOKENS`）可以直接用 worker.js 里的默认值，不配也能跑。
4. 回到 Worker 概览，记下地址（形如 `https://starry-ai-proxy.<你的子域>.workers.dev`）。
5. 打开网站 `/admin` → 「模型配置」页，把该地址填进「访客挂件代理」，保存——它会写进 `site-config.json` 并随站点发布。
6. 用无痕窗口（不带你的模型档案）打开首页点星球，验证访客链路。

## 方式二：命令行部署（装了 Node 的环境）

```bash
npm install -g wrangler
wrangler login
cd cloudflare
wrangler secret put AI_API_KEY     # 粘贴模型服务商的 Key
wrangler deploy
```

`wrangler.toml` 已带默认变量；换 DeepSeek 时改 `AI_BASE_URL` 与 `AI_ALLOWED_MODELS`（如 `deepseek-chat`）再 `wrangler deploy`。

## 改用其他服务商

| 变量 | 说明 | 示例 |
|---|---|---|
| `AI_BASE_URL` | OpenAI 兼容 base URL | `https://api.deepseek.com/v1` |
| `AI_ALLOWED_MODELS` | 白名单，逗号分隔，`*` 结尾为前缀通配 | `deepseek-chat,deepseek-reasoner` |
| `AI_MAX_TOKENS` | 单次回复输出上限（防滥用） | `1500` |
| `AI_API_KEY` | 服务商 Key（**必须用 Secret**，不进仓库/前端） | `sk-…` |

## 内置防线

- 只放行 `POST /v1/chat/completions`，其余 404；
- 模型白名单之外的模型名直接拒绝；
- 输出 tokens 上限强制收口；
- 每 IP 每小时 30 次（内存计数，Worker 重启清零；个人站足够，如果被刷再升级成 Cloudflare WAF 规则或 KV 计数）；
- Key 只存在于 Worker Secret，浏览器 / 仓库 / 前端产物里都没有。
