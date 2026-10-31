-- ============================================================
-- 星野漫游 · Supabase 点赞表初始化
-- 用法：Supabase Dashboard → SQL Editor → 整段粘贴 → Run（只需一次）
-- 设计：匿名访客可读、可调函数自增；表本体禁止直接写入（RLS）
-- ============================================================

-- 1. 点赞表：path = 内容唯一标识（如 issue-12、m-2026-10-25）
create table if not exists public.likes (
  path text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 2. 开启行级安全（RLS）
alter table public.likes enable row level security;

-- 3. 匿名（anon）只允许读
create policy "likes: anon can select"
  on public.likes for select
  to anon
  using (true);

-- 4. 收走匿名对表的直接写权限（双保险：没有 policy 本来就写不了）
revoke insert, update, delete on table public.likes from anon;

-- 5. 原子自增函数：唯一允许的写入通道
--    SECURITY DEFINER = 以表所有者身份执行，绕过 RLS 完成自增
--    upsert 保证首次点赞自动建行，并发下计数不会丢
create or replace function public.increment_like(p_path text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.likes (path, count) values (p_path, 1)
  on conflict (path) do update
    set count = public.likes.count + 1, updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;

-- 6. 匿名可执行上面这个函数（其余函数不受影响）
grant execute on function public.increment_like(text) to anon;

-- 完成。前端只需 Project URL + anon/publishable key。
