/**
 * 匿名点赞：Supabase 免费档，REST 直连（不引 SDK，省体积）。
 * 表结构与安全策略见 scripts/supabase-setup.sql：
 *   anon 只能 SELECT，写入只走 increment_like 原子自增函数（SECURITY DEFINER）。
 * 拉取/发送失败一律静默降级——点赞挂了不影响正文阅读。
 */
const URL = 'https://noueumqoguhikzmjetuu.supabase.co';
const KEY = 'sb_publishable_m_aCm2fn9GEJRV9hokGAmg_NBamZWOe';

const headers: Record<string, string> = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

/** 拉全量点赞计数（数据量小：一条一行） */
export async function fetchLikes(): Promise<Record<string, number>> {
  try {
    const r = await fetch(`${URL}/rest/v1/likes?select=path,count`, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const rows = (await r.json()) as Array<{ path: string; count: number }>;
    return Object.fromEntries(rows.map((row) => [row.path, row.count]));
  } catch {
    return {};
  }
}

/** 原子自增一条，返回服务端最新计数（失败返回 null） */
export async function sendLike(path: string): Promise<number | null> {
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/increment_like`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_path: path }),
    });
    if (!r.ok) return null;
    return (await r.json()) as number;
  } catch {
    return null;
  }
}
