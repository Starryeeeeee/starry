# 部署指南 · 从零上线到日常更新

站点仓库：**`starry`**（项目页模式，访问地址 `https://starryeeeeee.github.io/starry/`）。
git 不用装——WorkBuddy 自带了便携版 git：`C:\Users\Win10\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe`。

## 一、首次上线（只做一次）

1. **建仓库**：GitHub 上新建公开仓库，名字 `starry`（不要勾选 README / .gitignore，建空的）。
2. **推送代码**（在项目文件夹里执行；git 路径见上，可先把它加进 PATH 省得每次写全路径）：
   ```powershell
   git init -b main
   git config user.name "Starry"
   git config user.email "Jia100906985211@outlook.com"
   git add .
   git commit -m "星野漫游上线"
   git remote add origin git@github.com:Starryeeeeee/starry.git
   git push -u origin main
   ```
3. **打开 Pages 的 Actions 模式**：仓库 Settings → Pages → Source 选 **GitHub Actions**（只需一次）。
4. **建 `moment` 标签**：仓库 Issues → Labels → New label，名字 `moment`，颜色随意。

推送后 Actions 自动跑第一次构建，一两分钟后 <https://starryeeeeee.github.io/starry/> 就上线了。

## 二、日常更新

- **改代码/写文章**：改完 → `git add .` → `git commit -m "说明"` → `git push`，Actions 自动重新构建发布，1–2 分钟生效。
- **发废话条**：打开网站 → 登录 /admin（或用首页右下角的快速记录笔）→ 写一句 → 发布。写入的是仓库里 `src/data/moments.md` 文件，push 自动触发构建，1–2 分钟上站。
  （2026-11-14 起动态不再走 GitHub Issues；手机上第一次用需在浏览器里粘贴一次 PAT 登录。）

## 三、关于 SSH

推送用的私钥在 `C:\Users\Win10\.workbuddy\gh_deploy`（已验证是绑定 Starryeeeeee 账号的密钥）。
便携版 git 调用它时如果报 "Permissions are too open"，是因为密钥文件权限太宽，收紧即可：

```powershell
icacls C:\Users\Win10\.workbuddy\gh_deploy /inheritance:r /grant "${env:USERNAME}:R"
```

## 四、可能要调的地方

- 废话条数据源默认就是本仓库 + `moment` 标签；想换仓库/标签，在 deploy.yml 的 Build 步骤里加环境变量 `MOMENTS_REPO` / `MOMENTS_LABEL`。
- 想换成根路径站点（`starryeeeeee.github.io`）：把仓库改名，`astro.config.mjs` 里 `base` 改回 `'/'` 即可——站内链接都走 `src/lib/base.ts` 的 `u()`，自动适配。
