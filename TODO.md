# 项目备忘（站长和 AI 的待办清单，不进网页）

> 工作原则：网页上永远不出现"待补 / 待接入"之类的字样，这类信息只放这里。

## 待补链接
- [ ] 哔哩哔哩个人空间：`src/pages/index.astro` 里现在指向 bilibili.com 官网，换成你的空间地址
- [ ] 网易云音乐主页：`src/pages/index.astro` 里现在指向 music.163.com 官网，换成你的主页地址
- [ ] 废话条数据源：`src/lib/moments.ts` 现在拉取 `Starryeeeeee/starry` 仓库的 Issue，确认仓库建好、名字对得上

## 功能待接入
- [x] 废话条接 GitHub Issues（拉取逻辑已由另一会话实现，等 `starry` 仓库就绪）
- [x] 部署 GitHub Pages：**已上线 2026-10-25，https://starryeeeeee.github.io/starry/**（方法见 DEPLOY.md：WorkBuddy 便携版 git + ~/.workbuddy/gh_deploy 密钥 + Actions 自动构建）
- [x] 音乐播放器（2026-10-25 晚上线）：左下角浮动唱片，第一首 Komorebi；加歌 = mp3 丢进 `public/music/` + `src/components/MusicPlayer.astro` 列表加一行
- [x] 管理面板 /admin/（2026-10-25 深夜上线）：PAT 登录后网页里发废话条/写文章/删除/触发构建
- [ ] giscus 评论：**等用户两件一次性操作**——仓库 Settings 勾选 Discussions、安装 giscus App（github.com/apps/giscus），然后在 /admin「站点」页点"一键配置评论"即完成
- [ ] 匿名点赞（Supabase，废话条卡片上的按钮目前是禁用占位）
- [ ] 不蒜子访客统计
- [ ] 画廊在 /admin 的上传功能（现在加图仍需本地放文件 push）
- [ ] 管理令牌安全提醒：PAT 存在浏览器 localStorage，仅自己电脑用；泄露可在 github.com/settings/tokens 撤销
- [ ] `src/pages/icon-preview.astro` 是图标预览页，部署前可以删掉

## 字体（已接入 2026-10-25）
- [x] 三套 cn-font-split 子集从你的仓库搬到 `public/fonts/`：alihei（阿里汉仪AI黑体，正文/UI）、hanchan（寒蝉全圆体，标语/废话条/引用）、zihun（字魂正酷超级黑，品牌与章节标题）
- [ ] **版权确认**：字魂「正酷超级黑」是字魂网的付费商用字体，个人学习站风险低，但若网站以后有商业用途请换思源黑体 Heavy（免费商用）并重新跑 cn-font-split
- [ ] 英文/衬线用 STIX Two Text（@fontsource 自托管）；以后站长子集化思源宋体，可替换章节标题字体
- 工具说明：`fonts-transform.md`（cn-font-split 用法）已从 class-fund 仓库拷到项目根目录
