# 管理后台 UI 改造说明（macOS 原生感）

> 2026-10-31 · 范围：**仅 /admin 管理后台的样式与组件层**，不改功能、不改页面结构、不改任何 JS 行为。
> 主要目标是 AI 模型配置与对话两块（原先视觉最粗糙的区域）。

---

## 一、参考了哪些现成实现

### 工具层：Impeccable 设计 skill（本地）
- 路径 `~/.workbuddy/skills/impeccable`，本次用它的 `context`（载入项目既有 PRODUCT.md / DESIGN.md）与 `craft-floor`（质量底线：对比度、间距、抬升、动效、浏览器自带表面、禁用字形当图标等）。
- 它的作用是**约束**而不是出图：项目已有「纸白星图」的视觉世界，改动必须落在既有世界里；后台按站主要求升级为 macOS 原生感时，边界条件（禁 Unicode 字形当图标、抬升要有偏移与模糊、玻璃必须用于具体材质而非装饰）由它给出。

### 设计系统与组件库（GitHub 调研结果）

| 项目 | 许可 | 借鉴了什么 | 怎么用 |
|---|---|---|---|
| **Puppertino** `codedgar/Puppertino` | MIT，纯 CSS、无构建步骤 | Apple 官方色板（13 强调色 / 6 级文字 / 5 档填充）、材质分级（5 档模糊 + 抬升阴影）、分段控件 / 侧边栏 / 工具栏 / 弹出菜单的形态、「降透明 / 降动态」的无障碍降级策略 | **借鉴其 token 组织方式与降级策略**，未直接引入（它的 colors+buttons+forms 合计约 195KB，且类名体系会与站点自有 token 打架） |
| **shadcn-admin** `satnaing/shadcn-admin` | MIT | 后台分栏信息架构：左侧导航 + 右侧详情区，导航项按功能分组 | 借鉴布局结构（本站原本是顶部胶囊页签） |
| **Studio Admin** `arhamkhnz/next-shadcn-admin-dashboard` | MIT | 可折叠侧栏、设置类面板的分组排布、浅深色两套材质 | 借鉴「工具页用宽栏 + 侧栏」的比例设定 |
| **LiqUIdify**（记录的 iOS 17 / macOS 14 规格） | MIT | 圆角标尺（窗 12 / 卡 10 / 控件 6 / 输入 7）、抬升层级、动效时长档（0.15 / 0.3 / 0.5s）、44pt 触控目标 | 直接作为 `admin-mac.css` 里的 `--mac-r-*` / `--mac-e*` / `--mac-t*` 数值来源 |
| **Radix Colors** | MIT | 语义化色阶命名（背景 / 填充 / 分隔线 / 文字层级各一套），避免散落色值 | 借鉴 token 收敛思路 |
| **Apple HIG** | 官方规范 | 系统色（#007AFF / #0A84FF、systemGray 文字层级、separator rgba）、材质分层、内嵌字段与聚焦光晕、44pt 触控目标 | 整套 `--mac-*` token 的取值依据 |

### 为什么不直接上组件库
本站是 **Astro 5 + 零 UI 框架 + 全手写 CSS**（DESIGN.md 明令）。shadcn/Radix/Catalyst 都是 React 组件库，引入会破坏技术栈约束并显著增大体积；**Puppertino 是唯一技术上可直嵌的候选**（纯 CSS + MIT），但它的类名体系与暗色策略会与站点 token 双轨。因此本次选择：**取其规范与数值，落成一份只在 /admin 生效的独立样式表**，改动面最小、可回滚。

---

## 二、具体设计决策（每条都能在代码里指到）

| 决策 | 规格 | 落在哪 |
|---|---|---|
| **分栏窗口** | 桌面 ≥960px：整块后台是一个「窗口」，左 208px 侧边栏 + 右详情区；圆角 12px、抬升 2 级、overflow 裁切让侧边栏材质贴合窗口圆角 | `.macos-admin .admin .admin-body`（grid）、`.admin-tabs` |
| **侧边栏材质** | 半透明底 + `saturate(180%) blur(20px)` 毛玻璃；右侧 1px 分隔线；选中项为 systemBlue 填充 + 白字 | `.admin-tabs` / `.admin-tab.active` |
| **窄屏退化** | <960px：侧边栏变横向可滚动分段控件（10px 圆角、选中项白底浮起），面板独立成卡 | `@media (max-width: 959px)` |
| **系统色板** | 浅色 #007AFF / 深色 #0A84FF；文字四级（label / label-2 / label-3 + 占位）；分隔线 rgba(60,60,67,.18)；填充 rgba(120,120,128,.12) | `:root` 层的 `--mac-*` |
| **圆角标尺** | 窗 12 / 卡 10 / 控件 6 / 输入 7；胶囊只给小型控件（开关、模型切换、发送键、快捷胶囊） | `--mac-r-*` |
| **抬升三层** | e1 控件（1px/2px 阴影 + 0.5px 描边）/ e2 窗口 / e3 浮层（弹窗、对话框）；无零偏移彩色光晕 | `--mac-e1..e3` |
| **动效曲线** | macOS 标准 `cubic-bezier(.32,.72,0,1)`；快档 .18s / 标准 .28s；`prefers-reduced-motion` 下全部关掉 | `--mac-ease` / `--mac-t*` |
| **AI 对话气泡** | iMessage 式：用户 systemBlue 填充反白、助手白底描边、圆角 17px 且右下/左下收成 5px（气泡尾巴）、78% 最大宽度 | `.ai-msg.user` / `.ai-msg.bot` |
| **组合框输入条** | 胶囊容器（999px）+ 内部无边框输入 + 蓝色圆形发送键；聚焦时整条边框转 systemBlue 并加 3px 光晕 | `.ai-input-row` |
| **模式开关** | macOS 开关（38×22 轨道 + 白色旋钮），旋钮用径向渐变纯 CSS 画，不引图标字体 | `.ai-modes .kb-mode input` |
| **弹出菜单** | 模型切换弹层用 popover 材质（半透明 + 毛玻璃）+ 三级抬升；菜单项 hover 变 systemBlue 反白 | `.ai-model-pop` / `.ai-model-item` |
| **表单内嵌字段** | 1px 描边 + 极轻内阴影，聚焦改为 systemBlue 边框 + 3px 光晕；下拉框右侧加 chevron（内联 SVG）；字号 1rem 防止 iOS 聚焦缩放 | `.admin-panel input/select` |
| **模型档案卡** | 从胶囊改为纵向卡片列表，选中态 = 6% systemBlue 底 + 蓝色描边 + 1px 外圈；删除按钮用画的 SVG 叉号（两段式确认时自动让位给文字） | `.ai-profile-chip` / `.ai-profile-del` |
| **浏览器自带表面** | 滚动条、聚焦环、选中色、光标颜色全部纳入 palette | `.macos-admin *` / `::selection` / `:focus-visible` |
| **工具页用宽栏** | 后台容器从正文栏 680px 放宽到 1120px（表单不再被挤扁） | `.macos-admin .container.admin` |
| **字体** | 控件与对话用 `--font-sans`（栈首 PingFang SC —— 正是 macOS 中文界面字体）；页面标题保留 `--font-display-cn`；站点阅读字体不参与工具界面 | — |

### 无障碍与降级
- `prefers-reduced-transparency: reduce` → 三层材质退回不透明面（Puppertino 同款思路）
- 浏览器不支持 `backdrop-filter` → 自动退回不透明（`@supports not`）
- `prefers-reduced-motion: reduce` → 按钮/开关/页签过渡全部关闭
- 触屏（`hover: none`）→ 按钮最小高度提升到 42px，逼近 HIG 的 44pt 触控目标

---

## 三、改动清单（只有这些）

| 文件 | 改动 |
|---|---|
| `src/styles/admin-mac.css` | **新增**，全部新样式（约 600 行），作用域锁在 `body.macos-admin` |
| `src/layouts/Base.astro` | 4 处小改：按路径判断 `/admin` → 给 body 加 `macos-admin` 类 + 条件挂载新样式表 |
| `scripts/shot-admin.mjs` | 新增：无头 Edge CDP 自检截图脚本（改样式时用它看渲染结果） |

**没有动**：`src/pages/admin.astro` 的任何结构与 JS、所有 tab 的功能逻辑、数据链路。样式通过 `.macos-admin .admin .xxx`（三级类）压过 `admin.astro` 里的 scoped 样式（两级），不依赖打包顺序。

---

## 四、待定项

1. **模型切换胶囊与档案名里的 `◉`/`✕` 字形**：这两个字符是 `admin.astro` 的 JS 用 `textContent` 写进去的，属于字形当图标（craft-floor 禁止）。删除按钮已用 CSS 换成画的 SVG，但选中圆点需要改 JS（`updateModelPill` / `refreshProfileList`）——该文件正被另一个会话修改，等其收工后再动。
2. **侧边栏图标**：目前是纯文字导航。macOS 侧边栏通常配 16px 线性图标，站内已有 SVG 库可复用，加图标需要改 `admin.astro` 的按钮内容。
3. **对话框/弹窗**：目前只有「模型切换」一处浮层。将来若加确认对话框，可沿用 `--mac-e3` + 材质 token。
4. **访客可见的 AI 功能**：若要开放给访客，必须先加服务端代理（站主已在做 Cloudflare Worker 代理），否则 API Key 暴露在前端。
5. **视觉回归**：目前靠无头截图人工核对，没有基线快照。若后台改动频繁，可把 `scripts/shot-admin.mjs` 扩展成基线对比。

---

## 五、并行协作说明

本次改造期间，另一个 AI 会话正在修改 `src/pages/admin.astro`、`src/lib/ai.ts`、`src/components/AiPet.astro` 等文件。按《对接文档》第十四节的领地制：
- 我**没有触碰**这些文件，也没有提交它们的任何改动；
- 我的改动完全隔离在 `src/styles/admin-mac.css`、`src/layouts/Base.astro`、`scripts/shot-admin.mjs` 与本文档；
- 提交时使用精确 `git add <路径>`，不执行 `git add .`。
