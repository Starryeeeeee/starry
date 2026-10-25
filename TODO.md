# 项目备忘（站长和 AI 的待办清单，不进网页）

> 工作原则：网页上永远不出现"待补 / 待接入"之类的字样，这类信息只放这里。

## 待补链接
- [ ] 哔哩哔哩个人空间：把 `src/pages/index.astro` 里 `https://www.bilibili.com` 换成你的空间地址
- [ ] 网易云音乐主页：把 `src/pages/index.astro` 里 `https://music.163.com` 换成你的主页地址

## 功能待接入
- [ ] 废话条接 GitHub Issues（手机发 Issue 自动上站，占位代码在 `src/lib/moments.ts`）
- [ ] giscus 评论（文章页底部）
- [ ] 匿名点赞（Supabase，废话条卡片上的按钮目前是禁用占位）
- [ ] 不蒜子访客统计
- [ ] 部署 GitHub Pages（注意：这台电脑 `git` 不在 PATH，先理顺）

## 字体计划
- [ ] 站长子集化中文字体后提供 woff2（宋体标题、更多字重的文楷都可以换上）
- [ ] 目前临时方案：标题/签名用 STIX Two Text（西文），标语/废话条/引用用霞鹜文楷屏显版（npm 包自带分片），正文黑体

## 已知的小事
- [ ] `src/pages/icon-preview.astro` 是图标预览页，部署前可以删掉
