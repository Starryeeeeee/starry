// @ts-check
import { defineConfig } from 'astro/config';

// 部署到 GitHub Pages 项目页：仓库叫 starry，站点在 /starry/ 子路径。
// 若以后改用用户名仓库 starryeeeeee.github.io（根路径），把 base 改回 '/' 即可，
// 站内链接都经过 src/lib/base.ts 的 u() 包装，会自动适配。
export default defineConfig({
  site: 'https://starryeeeeee.github.io',
  base: '/starry/',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'one-light',
        dark: 'one-dark-pro',
      },
    },
  },
});
