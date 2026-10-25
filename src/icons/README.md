# 图标库 src/icons/

给「星野漫游」收集的开源 SVG 图标，按用途分四个文件夹。**挑中哪个就把哪个用进页面**，没用到的留在库里不碍事（不会被打包进产物）。

想可视化地挑：启动 `npm run dev` 后打开 **/icon-preview**，全部图标一页浏览，还支持明暗主题切换。

## 已应用到站内的位置

| 位置 | 用的图标 |
| --- | --- |
| 首页 hero 标题（原 👋 emoji） | `hand/wave-fluent-emoji-hc.svg`（预览页第 4 个，单色高对比，跟随主题） |
| 首页 hero 社交行 | `social/github` `social/bilibili` `social/netease-cloud-music` `social/outlook` + `ui/rss` |
| 页脚「03 联系」栏 | 同上五个 + `ui/arrow-up-right`（外链小箭头） |
| 浏览器标签页图标（favicon） | `public/favicon.svg`（不在本库内，见下方「站点图标 favicon」） |

## 站点图标 favicon

`public/favicon.svg` —— 树形实心剪影，纯黑 `#000000` 剪影 + 纯白 `#ffffff` 细描边光晕（`paint-order: stroke fill`），背景透明。

- **图形来源**：[Bootstrap Icons](https://github.com/twbs/icons/blob/main/icons/tree-fill.svg) 的 `tree-fill`
- **作者**：The Bootstrap Authors
- **许可证**：MIT（无需署名）
- **为什么加白色描边**：favicon 是静态 SVG，跟不了站点明暗主题。白描边只在剪影外侧生成一圈细 keyline，浅色标签栏上看不见、深色标签栏上勾出轮廓，两种背景都清晰。

换图标 = 改一行 import。比如想把招手换成摇摆笑脸：

```ts
import handIcon from '../icons/friendly/smile-animated.svg?raw';
```

---

## 文件夹清单

### social/ — 社交品牌（19 个）

来源：[Simple Icons](https://simpleicons.org)，许可证 **CC0**（公有领域，可商用、无需署名）。
全部是单色 `fill="currentColor"`，颜色跟随文字色，**明暗主题自动适配**；尺寸跟随字号（`width="1em"`）。

| 文件 | 对应 | 文件 | 对应 |
| --- | --- | --- | --- |
| `github.svg` | GitHub | `wechat.svg` | 微信 |
| `bilibili.svg` | 哔哩哔哩 | `qq.svg` | QQ |
| `netease-cloud-music.svg` | 网易云音乐 | `zhihu.svg` | 知乎 |
| `outlook.svg` | Outlook 邮箱 | `telegram.svg` | Telegram |
| `discord.svg` | Discord | `youtube.svg` | YouTube |
| `steam.svg` | Steam | `x.svg` | X（Twitter） |
| `instagram.svg` | Instagram | `spotify.svg` | Spotify |
| `tiktok.svg` | TikTok | `gmail.svg` | Gmail |
| `gitlab.svg` | GitLab | `mastodon.svg` | Mastodon |
| `rss.svg` | RSS（实心风） | | |

> 品牌图形本身是各公司的商标——个人主页放跳转链接属于合理使用，但别拿去暗示官方背书。

### hand/ — 招手 👋 的替代品（10 个）

同一个「挥手」的多种开源风格，用来替换首页 hero 里的 emoji：

| 文件 | 风格 | 来源 / 许可证 | 颜色 |
| --- | --- | --- | --- |
| `wave-phosphor.svg` | 细线条 | Phosphor Icons / MIT | 跟随主题 |
| `wave-phosphor-fill.svg` | 实心 | Phosphor Icons / MIT | 跟随主题 |
| `wave-phosphor-bold.svg` | 粗线条 | Phosphor Icons / MIT | 跟随主题 |
| `wave-phosphor-duotone.svg` | 双色（半透明叠加） | Phosphor Icons / MIT | 跟随主题 |
| `wave-fluent.svg` | 线条 | Fluent System Icons / MIT | 跟随主题 |
| `wave-fluent-emoji-flat.svg` | 彩色 emoji 扁平风 | Fluent Emoji / MIT | 固定彩色 |
| `wave-fluent-emoji-hc.svg` | 单色高对比 | Fluent Emoji / MIT | 跟随主题 |
| `wave-twemoji.svg` | 彩色 emoji（经典推特大圆手） | Twemoji / **CC-BY 4.0** | 固定彩色 |
| `wave-openmoji.svg` | 彩色 emoji 手绘风 | OpenMoji / **CC BY-SA 4.0** | 固定彩色 |
| `wave-animated.svg` | **会动的**（Fluent 扁平风 + SMIL 动画） | 改造自 Fluent Emoji / MIT | 固定彩色 |

选型建议：想要融入站内「莫奈水色」的克制气质 → **Phosphor 系**（线条风和页脚 RSS 图标同气质）；想保留 emoji 的亲和力但跨平台渲染一致 → `wave-fluent-emoji-flat` 或 `wave-twemoji`；想一进场就打招呼 → `wave-animated`。

### friendly/ — 友好笑脸（13 个）

不想用「招手」打招呼时，笑脸也是好选择。除注明外全部来自 **Fluent Emoji（MIT，无需署名）**。

| 文件 | 风格 | 颜色 |
| --- | --- | --- |
| `smile-animated.svg` | **会动的**：贴纸式左右摇摆 | 固定彩色 |
| `smile-hearts-animated.svg` | **会动的**：脸轻摆 + 三颗爱心错峰上浮呼吸 | 固定彩色 |
| `smile-grin.svg` | 咧嘴大笑 😬 | 固定彩色 |
| `smile-slight.svg` | 微笑 🙂 | 固定彩色 |
| `smile-eyes.svg` | 眯眼笑 😊 | 固定彩色 |
| `smile-hearts.svg` | 爱心脸 🥰 | 固定彩色 |
| `smile-star-struck.svg` | 星星眼 🤩 | 固定彩色 |
| `smile-sun.svg` | 太阳脸 ☀️ | 固定彩色 |
| `smile-halo.svg` | 天使光环 😇 | 固定彩色 |
| `smile-hug.svg` | 拥抱 🤗 | 固定彩色 |
| `smile-slight-hc.svg` | 微笑 · 单色高对比 | 跟随主题 |
| `smile-eyes-hc.svg` | 眯眼笑 · 单色高对比 | 跟随主题 |
| `smile-hearts-hc.svg` | 爱心脸 · 单色高对比 | 跟随主题 |

### ui/ — 界面小图标（21 个）

来源：[Lucide](https://lucide.dev)，许可证 **ISC**。线条风格（和首页 hero 里那个 RSS 图标是同一家的），`currentColor`，跟随主题。

`mail` `sun` `moon` `moon-star` `arrow-up-right` `external-link` `calendar` `clock` `folder` `file-text` `search` `heart` `star` `sparkles` `rocket` `send` `rss` `pen-line` `globe` `music` `play`

顺手的使用场景举例：

- `arrow-up-right` → 替换页脚「GitHub ↗」里的文字箭头 ↗
- `calendar` / `clock` → 文章元信息里日期、阅读时间前的小图标
- `folder` → 作品集分类；`pen-line` → 文章列表标题；`rocket` → 作品卡片
- `moon-star` / `sparkles` → 装饰「星野」主题的小元素

---

## 怎么用进页面

### 方式一：内联进模板（推荐，最灵活）

直接把 SVG 文件内容复制进 `.astro` 组件。单色图标记得让颜色由外层控制：

```astro
<a href="https://github.com/Starryeeeeee" aria-label="GitHub" class="icon-link">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <!-- 把 github.svg 里 <path d="..."> 复制进来 -->
  </svg>
</a>
```

### 方式二：`?raw` 导入 + set:html（不用复制大段路径）

```astro
---
import githubIcon from '../icons/social/github.svg?raw';
import waveIcon from '../icons/hand/wave-animated.svg?raw';
---
<a href="https://github.com/Starryeeeeee" aria-label="GitHub">
  <Fragment set:html={githubIcon} />
</a>

<!-- 招手：直接复用首页标题的样式类 -->
<h1>嗨，我是 Starry <span class="hero-wave"><Fragment set:html={waveIcon} /></span></h1>
```

导入的是文件原文，`currentColor`、内嵌动画都保留；大小用 CSS 控制（图标本身是 `1em`）：

```css
.hero-wave svg { width: 1em; height: 1em; vertical-align: -0.12em; }
```

### 方式三：当静态图片用（彩色图标省事，但没法用 currentColor 变色）

```astro
---
import { Image } from 'astro:assets';
import wave from '../icons/hand/wave-fluent-emoji-flat.svg';
---
<Image src={wave} alt="" width={28} height={28} />
```

`<img>` 方式引用时 SMIL 动画（wave-animated）依然会播放；但 `currentColor` 类图标会变黑色，需要自己改 fill 或选固定彩色款。

---

## 动效相关

- `wave-animated.svg`：挥四下 → 停 1.7 秒 → 循环，动画内嵌在 SVG 里（SMIL），零 JS 零 CSS，`begin="0.8s"` 是为了等 hero 标题入场。想改节奏：调 `dur`（周期）、`keyTimes`（挥手/停顿占比）、`begin`（起始延迟）。
- 站内已有的 `.hero-wave` CSS 动画（hover 时挥手）对任何静态招手 SVG 依然生效，直接给 `<span class="hero-wave">` 包住即可。
- 无障碍：`prefers-reduced-motion` 下 CSS 动画会自动停（global.css 已处理），但 SMIL 不会自动停。在意的话给动画版包一层判断，或直接用静态款。

## 许可证注意事项（用了哪个就保留哪条的说明）

- **CC0**（Simple Icons）、**MIT**（Phosphor / Fluent）、**ISC**（Lucide）：无需署名，随意用。文件头注释里已留来源，别删更省心。
- **CC-BY 4.0**（Twemoji，即 `wave-twemoji.svg`）：需要署名。用了的话在页脚加一行，例如：`部分图形来自 Twemoji（X Corp.），采用 CC-BY 4.0 许可`。
- **CC BY-SA 4.0**（OpenMoji，即 `wave-openmoji.svg`）：需要署名，且对该图形本身的修改需以相同协议共享（用于网页展示不触发，改图形源文件才需要）。嫌麻烦就不用它，备选很多。

## 往库里加新图标

去 [icon-sets.iconify.dev](https://icon-sets.iconify.dev) 搜到想要的图标（认准 CC0 / MIT / ISC 许可的图标集），在 `scripts/fetch-icons.mjs` 的清单里照格式加一行，然后：

```bash
node scripts/fetch-icons.mjs
```

图标集推荐：`simple-icons`（品牌）、`lucide` / `tabler` / `phosphor`（界面线条）、`fluent-emoji-*`（彩色 emoji）。
