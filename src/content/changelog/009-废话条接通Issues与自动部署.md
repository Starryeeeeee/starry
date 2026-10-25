---
title: 废话条接通 GitHub Issues 与自动部署
date: 2026-10-25
---

- 废话条从本地假数据切换为 **GitHub Issues 后台**：手机 GitHub App 发一条带 `moment` 标签的 Issue，推送触发构建后即自动上站；API 拉取失败时自动回退占位数据，站点永远能构建成功（仓库地址、标签名都可用环境变量覆盖）
- 废话条页和首页补了空态指引：还没发过 Issue 时会直接告诉访客（和自己）发布方法
- 新增 **GitHub Pages 部署工作流**（`.github/workflows/deploy.yml`）：推送到 main 或手动触发即自动构建发布；CI 内置令牌拉 Issue，不受匿名 API 限额影响
