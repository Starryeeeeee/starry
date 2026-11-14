# 星野漫游 · 文件上传服务（Cloudflare Worker + R2）

后台 `/admin` 上传的图片与文档不再进 Git 仓库，改存 Cloudflare R2。
GitHub 仓库只留元数据清单（`src/data/kb-files.json`、`src/data/gallery-files.json`）。

```
浏览器 /admin ──POST /upload──▶ 本 Worker ──▶ R2 桶
     │                            │
     │                            └── 校验：站主身份 / 类型白名单 / 体积上限 / 速率
     └── 拿到对象 key 后，用 GitHub Contents API 更新清单 → push 触发构建
```

## 准备（一次就够，约 10 分钟）

### 1. 建 R2 桶
1. dash.cloudflare.com → **R2**（左侧）→ **Create bucket**，名字填 `starry-files`。
2. 打开这个桶 → **Settings** → **Public access** → 打开 **r2.dev** 子域名（免费）。
   复制它给你的公开地址，形如 `https://pub-xxxxxxxx.r2.dev`（pub- 后是一长串随机字符，以桶设置里实际显示的为准）。
   > 这个地址就是 R2_PUBLIC_BASE，也是站外访问文件用的域名。
   > 想用自己的域名也行：Workers & Pages → 域名 → 添加自定义域，指向这个桶。

### 2. 建 Worker 并绑定桶
1. **Workers & Pages** → **Create** → **Create Worker**，名字 `starry-file-upload`，Deploy。
2. 点 **Edit code**，把本目录 `worker.js` 全文粘进去，替换模板，**Deploy**。
3. **Settings** → **Bindings** → **Add** → **R2 bucket**：
   - Variable name：`FILES`（必须和代码里的 `env.FILES` 一致）
   - R2 bucket：选 `starry-files`
   - **Deploy** 保存。

### 3. 配置变量
**Settings** → **Variables and Secrets**：

| 名称 | 类型 | 值 |
|---|---|---|
| `ALLOWED_GITHUB_LOGIN` | Text | `Starryeeeeee` |
| `ALLOWED_ORIGINS` | Text | `https://starryeeeeee.github.io,http://localhost:4321` |
| `R2_PUBLIC_BASE` | Text | 第 1 步拿到的公开地址，如 `https://pub-xxxxxxxx.r2.dev` |
| `MAX_KB_BYTES` | Text | `41943040`（40MB） |
| `MAX_GALLERY_BYTES` | Text | `12582912`（12MB） |
| `RATE_PER_HOUR` | Text | `60` |

**可选**：加一个 Secret `UPLOAD_KEY`（随机长字符串）。设了之后就可以用它代替 GitHub PAT 上传——
不想把 PAT 交给 Worker 时用，代价是站主要多粘贴一次这个 key。

### 4. 在后台填地址
打开网站 `/admin` → 「知识库」页 → 「R2 存储」区域：
- **上传服务地址**：Worker 地址，形如 `https://starry-file-upload.你的子域.workers.dev`
- **公开访问地址**：R2 公开地址（同 `R2_PUBLIC_BASE`，Worker 也会在上传成功时自动回填）

这两个地址存在 `public/site-config.json` 的 `storage` 字段里，随站点发布。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/upload` | 请求体是文件原始字节；`X-File-Kind: kb\|gallery`、`X-File-Name: 原文件名`、`Content-Type` 必填。返回 `{ ok, key, url, size, type, name }` |
| `DELETE` | `/object?key=…` | 删除对象（删除内容时同步清理、上传后清单写失败时清孤儿） |
| `GET` | `/health` | 自检：返回是否已绑定桶、公开地址、各上限 |

**授权**：请求头带 `Authorization: Bearer <你的 GitHub PAT>`，Worker 会向
`api.github.com/user` 核实这枚令牌属于 `Starryeeeeee` 才放行；或者带 `X-Upload-Key: <UPLOAD_KEY>`。

## 内置防线

- 只放行站主：PAT 身份不符直接 403；未带令牌 401；
- 对象名**服务端生成**（`kb/20261114-171233-a1b2c3d4.pdf`），不采用客户端文件名，杜绝路径穿越与覆盖同名；
- 类型白名单（Content-Type 与扩展名双查）+ 体积上限，**按实际读到的字节数判定，不信 `Content-Length`**；
- 每 IP 每小时 60 次；
- CORS 只放行 `ALLOWED_ORIGINS` 里的来源，其他来源拿不到响应；
- R2 用 binding 注入，凭证既不在代码里、也不在仓库里。

## 缓存与访问

- R2 的 `r2.dev` 域名默认会缓存公开对象；文件名带时间戳与随机串，天然不会撞缓存。
- 文件是公开桶里的公开对象：**能访问 URL 就能下载**。私密资料不要放这里——
  私密文件需要另一套鉴权读取方案（计划里 P5.4 已注明这一点）。
- 浏览器预览 PDF 时，R2 需要允许跨域（`r2.dev` 默认允许 `GET`/`HEAD` 跨域；若自建域名，
  记得在 CORS 策略里加上站点来源）。

## 费用

R2 标准档公开价格：每月 10 GB-月存储、100 万次 Class A、1000 万次 Class B 操作，
**互联网出站流量免费**。个人站用量远低于此。上线前请核对
[最新价格与额度](https://developers.cloudflare.com/r2/pricing/) 与账户计费设置。

## 存量文件怎么办

- 旧的 `public/kb/` 文件与 `src/assets/gallery/` 图片**继续照常可用**（读取端按清单里的
  `storage` 字段区分新旧路径），不需要重写 Git 历史。
- 想把旧文件也搬进 R2：在 `/admin` 用同一份文件重新上传一次（新文件会进 R2），
  确认新链接可访问后，再删掉仓库里的旧文件即可，随时可回退。
