# 项目备忘（站长和 AI 的待办清单，不进网页）

> 工作原则：网页上永远不出现"待补 / 待接入"之类的字样，这类信息只放这里。

## 待补链接
- [ ] 哔哩哔哩个人空间：`src/pages/index.astro` 里现在指向 bilibili.com 官网，换成你的空间地址
- [ ] 网易云音乐主页：`src/pages/index.astro` 里现在指向 music.163.com 官网，换成你的主页地址
- [x] 废话条数据源：确认跑通（2026-10-30 线上已显示手机发的 2 条真实动态）

## 功能待接入
- [x] 废话条接 GitHub Issues（拉取逻辑已由另一会话实现，等 `starry` 仓库就绪）
- [x] 部署 GitHub Pages：**已上线 2026-10-25，https://starryeeeeee.github.io/starry/**（方法见 DEPLOY.md：WorkBuddy 便携版 git + ~/.workbuddy/gh_deploy 密钥 + Actions 自动构建）
- [x] 音乐播放器（2026-10-25 晚上线）：左下角浮动唱片，第一首 Komorebi；加歌 = mp3 丢进 `public/music/` + `src/components/MusicPlayer.astro` 列表加一行
- [x] 管理面板 /admin/（2026-10-25 深夜上线）：PAT 登录后网页里发废话条/写文章/删除/触发构建
- [x] 知识库（2026-10-30 上线）：/admin「知识库」tab 写笔记/传文档（PDF/Word/PPT → public/kb/），浏览页 /kb/ 支持科目筛选+搜索；手写条目在 `src/content/kb/`，文档清单在 `src/data/kb-files.json`
- [x] 统一内容 ID + 三态 status（2026-10-30）：/admin 新建内容自动写入稳定 ID（c-日期-随机码）与状态；旧内容编辑时惰性补 ID；草稿不构建、归档列表隐藏直链可见；设计细节见《对接文档.md》第十二节
- [x] AI 接入·第一阶段（2026-10-31 上线）：`src/lib/ai.ts` OpenAI 兼容接入层 + 构建时全站索引 `/api-index.json` + /admin「AI 助手」tab（Agnes/DeepSeek/自定义预设、测试连接、资料问答）；站长在 AI tab 选 Agnes 预设、粘贴 key、保存即可用
- [x] AI 接入·二期：深度思考 / 联网搜索双开关（2026-10-31）。思考按服务商自动适配（DeepSeek→reasoner 模型 / Agnes→enable_thinking / 智谱→thinking.type）；联网搜索智谱 GLM 走服务端原生 web_search（稳），Agnes/DeepSeek 走公共 CORS 中转抓必应 RSS（尽力而为，失败自动降级为仅站内资料）；实现细节见《对接文档.md》第十三节
- [ ] AI 接入·第三阶段：正式使用时在 /admin 切 DeepSeek 或智谱预设换 key；**给访客开放 AI 前必须加代理**（Supabase Edge Function 或 Cloudflare Worker 转发 chat/completions），否则 key 会暴露在前端；代理落地后可把联网搜索也改成服务端做（比公共中转稳定）
- [ ] giscus 评论：**等用户两件一次性操作**——仓库 Settings 勾选 Discussions、安装 giscus App（github.com/apps/giscus），然后在 /admin「站点」页点"一键配置评论"即完成；配置时把 data-mapping 从 pathname 切到 specific（内容 ID），评论不再随 URL 变化丢失
- [x] 匿名点赞（2026-10-30 代码上线）：Supabase REST 直连，RLS 设计（anon 只读+只能调 increment_like 原子自增函数）；**等站主跑一次 `scripts/supabase-setup.sql`**（Dashboard → SQL Editor 粘贴 Run），跑完点赞按钮自动激活（**2026-10-31 站主决定搁置**：SQL 未跑前点赞按钮在全站自动隐藏，不影响任何功能；想激活随时跑 SQL）
- [x] Supabase 保活：.github/workflows/supabase-keepalive.yml，每周一自动 ping，防免费档 7 天无活动被暂停
- [ ] 不蒜子访客统计
- [ ] 画廊在 /admin 的上传功能（现在加图仍需本地放文件 push）
- [ ] 管理令牌安全提醒：PAT 存在浏览器 localStorage，仅自己电脑用；泄露可在 github.com/settings/tokens 撤销
- [ ] `src/pages/icon-preview.astro` 是图标预览页，部署前可以删掉

## 字体（已接入 2026-10-25）
- [x] 两套 cn-font-split 子集在 `public/fonts/`：alihei（阿里汉仪AI黑体，官方免费商用，正文/UI/标题）、hanchan（寒蝉全圆体，开源免费，标语/废话条/引用）；字魂正酷黑已按站长要求全站移除（2026-10-31，文件与引用均无残留）
- [ ] 英文/衬线用 STIX Two Text（@fontsource 自托管）；以后站长子集化思源宋体，可替换章节标题字体
- 工具说明：`fonts-transform.md`（cn-font-split 用法）已从 class-fund 仓库拷到项目根目录
