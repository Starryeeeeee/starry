// 站点部署在 GitHub Pages 项目页（如 https://starryeeeeee.github.io/starry/）时，
// 站内链接都要带上 base 前缀。用法：href={u('/posts/')} → '/starry/posts/'。
// 若以后换回根路径站点（astro.config 里 base 改回 '/'），u() 原样返回，模板无需再动。
export const u = (path: string) =>
  import.meta.env.BASE_URL.replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`);
