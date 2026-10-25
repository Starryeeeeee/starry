/**
 * 废话条数据源：GitHub Issues 当后台。
 *
 * 发布方式：手机 GitHub App 打开站点仓库 → New issue →
 *   标题写动态内容 → 打上 `moment` 标签 → Publish。
 * 站点在构建时通过 GitHub API 拉取带该标签的开放 Issue，渲染成动态流。
 * （只认标签是为了把「废话条」和普通反馈/任务 Issue 区分开）
 *
 * 环境变量（都不设也能跑：仓库不可达时回退到下面的占位数据，保证站点永远能构建）：
 *   MOMENTS_REPO   数据仓库，默认 'Starryeeeeee/starry'（即站点仓库）
 *   MOMENTS_LABEL  标签名，默认 'moment'
 *   GITHUB_TOKEN   访问令牌（GitHub Actions 里自动提供），提高 API 限额
 */
export type Moment = {
  id: string;
  date: Date;
  text: string;
};

// 本地占位数据：仓库还没建好 / 断网 / API 失败时兜底
export const sampleMoments: Moment[] = [
  {
    id: 'm-2026-10-25',
    date: new Date('2026-10-25'),
    text: '网站今天立项啦！站名想了三轮，最后定了「星野漫游」✦ 以后这里就是我的小星球了。',
  },
  {
    id: 'm-2026-10-24',
    date: new Date('2026-10-24'),
    text: '把需求文档写了三页才发现，原来「我想要个网站」背后有这么多要想的事。',
  },
  {
    id: 'm-2026-10-23',
    date: new Date('2026-10-23'),
    text: 'AI 一口气帮我搭好了项目骨架，我负责看懂每一行（在努力了）。',
  },
];

export async function getMoments(): Promise<Moment[]> {
  const repo = process.env.MOMENTS_REPO ?? 'Starryeeeeee/starry';
  const label = process.env.MOMENTS_LABEL ?? 'moment';
  const token = process.env.GITHUB_TOKEN;

  const api = `https://api.github.com/repos/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&sort=created&direction=desc&per_page=30`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(api, { headers });
    if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
    const issues = (await res.json()) as Array<{
      number: number;
      title: string;
      created_at: string;
      pull_request?: unknown;
    }>;

    // Issue 标题即动态内容，创建时间即发布时间；PR 会被 issues API 一并返回，剔除掉
    return issues
      .filter((i) => !i.pull_request)
      .map((i) => ({
        id: `issue-${i.number}`,
        date: new Date(i.created_at),
        text: i.title,
      }));
    // 注意：拉取成功但没有带标签的 Issue 时返回空数组（页面上会显示发布指引），
    // 只有「拉取失败」才回退占位数据——两种情况要能区分开。
  } catch (err) {
    console.warn(
      `[moments] 拉取 ${repo} 的 Issue 失败（${err instanceof Error ? err.message : err}），使用本地占位数据`,
    );
    return [...sampleMoments].sort((a, b) => b.date.valueOf() - a.date.valueOf());
  }
}
