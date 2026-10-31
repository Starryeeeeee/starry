# DESIGN.md — 星野漫游视觉世界

> 视觉世界的单一事实源。token 定义在 `src/styles/global.css` 的 `:root`，这里记录"为什么"与用法约定。

## 世界观

**纸白上的星图**：米白纸底（#faf9f5）承墨灰文字，霁蓝（#466f9a）做唯一的强调色——"在纸上更挺括的一档蓝"。整体是安静、明亮、印刷质感的私人刊物，AI 成员（星渚/曜魄/云渚）是这个世界里的角色，不是插件。

## Token 速查（定义见 global.css :root）

| 用途 | token | 备注 |
|---|---|---|
| 页面底 | `--bg` #faf9f5 纸白 | 暗色 #1d1c1a 暖炭灰 |
| 卡片/容器 | `--surface` #fff | |
| 正文 | `--ink` #30353a 墨灰 | |
| 次要/弱化文字 | `--ink-2` / `--ink-3` | ink-3 只用于 ≥0.8rem 的真辅助文字 |
| 边线 | `--line` #e7e3da | |
| 强调 | `--accent` / `--accent-ink` | 霁蓝；文字用 accent-ink 保证对比度 |
| 浅色画布 | `--wash` #edf1ec | 聊天区、编辑横幅等"容器内的区域" |
| 圆角 | `--radius` 14px | 控件 8-12px，胶囊 999px；禁止大圆角 |
| 阴影 | `--shadow` | 有偏移有模糊；禁止零偏移彩色光晕 |
| 缓动 | `--ease-out` / `--ease-spring` | 入场用 ease-out |

## 字体

- 展示/标题：`--font-display-cn`（阿里汉仪AI黑体，免费商用）
- 正文：`--font-body`（霞鹜文楷屏幕版；按主题可切宋体/圆体）
- 等宽：`--font-mono`，只用于代码、数据、token 类内容
- 中文排版：正文行高 1.7–1.9；正文不加 letter-spacing；避头尾；中西文之间留呼吸；数字/时间戳用 tabular-nums

## 布局与组件约定

- 正文栏宽 `--w-text: 680px`，宽区 `--w-wide: 1080px`
- 后台面板（/admin）：每个 tab 一张白底圆角卡（surface+line+radius），登录页同卡；卡内小区域用 wash 画布**不带边框**（禁卡中卡）
- 表单控件：8-14px 内边距、1px line 边、8px 圆角、聚焦 2px accent outline；输入字号 ≥1rem（防 iOS 聚焦缩放）
- 按钮：admin-btn 体系（primary 霁蓝底白字 / 默认白底 / ghost 小号 / danger 陶土玫瑰 #b4766b）；危险操作一律两段式就地确认（armDelete），不弹 confirm
- 触控目标：正文按钮 ≥44px 高，ghost 在触屏下放大；删除类小按钮必须加 aria-label
- 反馈：toast（.admin-msg，底部居中胶囊，成功墨灰/错误陶土玫瑰，显式传 error 参数而非正则猜）
- 图标：本地 SVG 库 `src/icons/`，`?raw` 内联，currentColor；禁止 emoji/Unicode 字符当图标

## 动效

- 一处有主见的时刻即可；入场淡入+上移 6px（0.28s ease-out）；列表 hover 轻反馈
- 一律尊重 `prefers-reduced-motion`；思考中指示为三个固定尺寸圆点的透明度呼吸（不用 content 动画，不改布局）

## 已知取舍

- PAT/Key 明文存 localStorage：单人信任边界内的有意取舍（见 PRODUCT.md 安全分级）
- AI 联网搜索的公共中转通道不稳定是已知短板，失败降级为"仅站内资料回答"
- 字魂正酷黑为付费商用字体，商用前需替换（TODO.md 字体节）
