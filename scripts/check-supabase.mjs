// 检查 Supabase likes 表状态（表未建时应返回 404/PGRST205）
const URL = 'https://noueumqoguhikzmjetuu.supabase.co';
const KEY = 'sb_publishable_m_aCm2fn9GEJRV9hokGAmg_NBamZWOe';
const r = await fetch(`${URL}/rest/v1/likes?select=count&limit=1`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
console.log('GET /rest/v1/likes:', r.status);
const t = await r.text();
console.log(t.slice(0, 300));
