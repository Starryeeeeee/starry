/**
 * 匿名点赞：Supabase 免费档，REST 直连（不引 SDK，省体积）。
 * 表结构与安全策略见 scripts/supabase-setup.sql：
 *   anon 只能 SELECT，写入只走 increment_like 原子自增函数（SECURITY DEFINER）。
 * 表还没建（或 Supabase 不可达）时 fetchLikes 返回 null——页面据此隐藏点赞按钮。
 */
const URL = 'https://noueumqoguhikzmjetuu.supabase.co';
const KEY = 'sb_publishable_m_aCm2fn9GEJRV9hokGAmg_NBamZWOe';

const headers: Record<string, string> = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

/** 拉全量点赞计数。失败返回 null（= Supabase 未就绪，页面应隐藏点赞按钮） */
export async function fetchLikes(): Promise<Record<string, number> | null> {
  try {
    const r = await fetch(`${URL}/rest/v1/likes?select=path,count`, { headers });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<{ path: string; count: number }>;
    return Object.fromEntries(rows.map((row) => [row.path, row.count]));
  } catch {
    return null;
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

/**
 * 给页面上所有 [data-like-id] 按钮接上点赞逻辑：
 * 拉计数 → 未就绪时隐藏按钮 → 已就绪则点亮计数并绑定点击（一浏览器一条一次）。
 * 任何页面引入本函数即可，与内容类型无关。
 */
export function initLikeButtons(): void {
  const btns = [...document.querySelectorAll<HTMLButtonElement>('.moment-like')];
  if (!btns.length) return;

  let liked: Set<string>;
  try {
    liked = new Set(JSON.parse(localStorage.getItem('sr-liked') ?? '[]'));
  } catch {
    liked = new Set();
  }

  function paint(btn: HTMLButtonElement, count: number, isLiked: boolean) {
    const c = btn.querySelector('.count') as HTMLElement | null;
    if (c) c.textContent = String(count);
    btn.classList.toggle('is-liked', isLiked);
    btn.setAttribute('aria-pressed', String(isLiked));
  }

  fetchLikes().then((map) => {
    if (!map) return; // Supabase 未就绪：按钮保持隐藏
    for (const btn of btns) {
      const id = btn.dataset.likeId as string;
      paint(btn, map[id] ?? 0, liked.has(id));
      btn.hidden = false;
      btn.disabled = false;
    }
  });

  for (const btn of btns) {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.likeId as string;
      if (liked.has(id) || btn.disabled) return; // 一人一条一次
      btn.disabled = true;
      liked.add(id);
      const countEl = btn.querySelector('.count') as HTMLElement | null;
      if (countEl) countEl.textContent = String(Number(countEl.textContent ?? '0') + 1);
      btn.classList.add('is-liked');
      btn.setAttribute('aria-pressed', 'true');
      const server = await sendLike(id);
      if (server !== null && countEl) countEl.textContent = String(server);
      else {
        // 发送失败就当没点过
        btn.classList.remove('is-liked');
        btn.setAttribute('aria-pressed', 'false');
        liked.delete(id);
      }
      localStorage.setItem('sr-liked', JSON.stringify([...liked]));
      btn.disabled = false;
    });
  }
}
