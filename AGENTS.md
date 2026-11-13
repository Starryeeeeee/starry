# AGENTS.md · 星野漫游（Starry Roam）

给所有 AI 协作者的入口文件。**动手前先读完这一页**，再按链接读对应文档。

## 项目是什么

Astro 5 个人站，GitHub Pages 托管，GitHub Issues 当动态后台，零服务器零成本。
线上 `https://starryeeeeee.github.io/starry/`，本地 `C:/Users/Win10/Desktop/starry-roam`。

## 先读什么

| 你想做什么 | 先读 |
|---|---|
| 任何改动 | 本文件 → `对接文档.md`（尤其第十四节多会话协作协议） |
| 产品定位 / 内容结构 | `PRODUCT.md` |
| 视觉 / 样式 / 组件 | `DESIGN.md` |
| 接下来做什么、顺序与验收 | `改进计划.md` |
| 待办与已知坑 | `TODO.md` |

## 硬约束

1. **动手前必须 `git status`**，确认当前分支与未提交改动。绝不覆盖、绝不 stash 别人的东西。
2. **领地制**：同一时间只允许一个 AI 改同一批文件。改动只碰自己领地的文件，跨领地先停下来说明。
3. **精确提交**：`git add <具体文件>`，禁止 `git add .`。
4. **不引入框架**：不加 React / Vue / Tailwind / UI 组件库 / 无必要的 npm 依赖。
5. **不重写 `global.css`**：只在其中做增量收敛。
6. **不动部署链**：不改 GitHub Actions、不改 `npm run build` 的生产逻辑、不把 `build:local` 产物提交到 main。
7. **密钥**：不读取、不复制、不输出、不提交 `C:/Users/Win10/.workbuddy/gh_deploy` 与任何 PAT / API Key。
8. **链接一律走 `u()`**（`src/lib/base.ts`），生产在 `/starry/` 子路径下。
9. **每次改动后跑 `npm run build`**，构建通过才算完成。
10. **完成即停**：`改进计划.md` 里一个阶段做完就汇报并提交，不要自动进入下一阶段。

## 视觉红线（详见 DESIGN.md）

- 纸白底 + 墨灰字 + 霁蓝强调；明亮或莫兰迪色系，印刷质感，小圆角，动效克制。
- 禁止：霓虹、深蓝渐变、粒子特效、大圆角、零偏移彩色光晕。
- 颜色一律走 token，不新写 hex。
- 新增任何「装饰性视觉」（玻璃、流光、终端、发光）前，先在 `DESIGN.md` 里裁定，不允许直接落地。

## 并行协作

站主会同时开多个 AI 会话。改完必须：构建验证 → 精确提交 → 在汇报里写清 commit id，供下一个会话接手。

## 站点打不开时先查这里（2026-11-13 踩过）

线上返回 404、而代码与构建都正常时，**九成是 Pages 的发布来源被改了**，不是代码问题：

1. 打开仓库 Actions，看最新 run 的名字：
   - `Deploy to GitHub Pages` → 自己的流水线在跑，正常。
   - `pages build and deployment` → **来源被切成「从分支发布」**，GitHub 正拿 Jekyll 解析 Astro 源码，必然失败。
2. 修法：Settings → Pages → Build and deployment → Source 选回 **GitHub Actions**，然后 Run workflow 重跑。改代码没有任何用。
3. `deploy.yml` 现在自带两道自检：发布前查 `build_type`，发布后访问首页并对账 `<meta name="sr-build">` 里的提交号。自检红了先看它打印的诊断，不要从头猜。

判据：`build` 全绿但 `deploy` 那一步红，就是这个故障；404 页面标题写着 "Site not found" 也可确认。

