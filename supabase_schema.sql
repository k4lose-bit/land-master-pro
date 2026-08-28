-- ============================================================
-- Land Master Pro 커뮤니티 데이터베이스 스키마 (Supabase)
-- 사용법: supabase.com → 프로젝트 → SQL Editor 에 이 파일 전체를
--        붙여넣고 Run 한 번이면 끝. (README 3단계 참고)
-- ============================================================

-- 게시글
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);

-- 댓글
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- 행 수준 보안(RLS): 읽기는 모두, 쓰기는 로그인 회원 본인만
alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "read posts" on public.posts;
create policy "read posts" on public.posts for select using (true);

drop policy if exists "insert own posts" on public.posts;
create policy "insert own posts" on public.posts
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "delete own posts" on public.posts;
create policy "delete own posts" on public.posts
  for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "read comments" on public.comments;
create policy "read comments" on public.comments for select using (true);

drop policy if exists "insert own comments" on public.comments;
create policy "insert own comments" on public.comments
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "delete own comments" on public.comments;
create policy "delete own comments" on public.comments
  for delete to authenticated using (auth.uid() = author_id);

-- 조회 성능
create index if not exists idx_posts_created on public.posts (created_at desc);
create index if not exists idx_comments_post on public.comments (post_id, created_at);

-- 참고: 운영자가 임의 글을 삭제하려면 Supabase 대시보드(Table Editor)에서
-- 직접 삭제하면 됩니다. RLS는 사이트 이용자에게만 적용됩니다.
