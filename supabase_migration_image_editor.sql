-- ============================================================
-- 커뮤니티 "리치 에디터(글자크기·색상·이미지 첨부)" 기능 추가 마이그레이션
-- supabase_schema.sql, supabase_migration_edit.sql을 이미 실행한 프로젝트에서
-- 추가로 실행하세요. (SQL Editor에 붙여넣고 Run 한 번이면 끝)
-- ============================================================

-- 1) 게시글 본문 길이 제한 확장 (이미지 태그·서식 태그 포함 대비, 1~5000자 → 1~20000자)
alter table public.posts drop constraint if exists posts_content_check;
alter table public.posts add constraint posts_content_check
  check (char_length(content) between 1 and 20000);

-- 2) 이미지 업로드용 Storage 버킷 생성 (공개 읽기)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- 3) Storage 접근 정책: 누구나 읽기, 로그인 회원만 업로드, 본인 파일만 삭제
drop policy if exists "public read post-images" on storage.objects;
create policy "public read post-images" on storage.objects
  for select using (bucket_id = 'post-images');

drop policy if exists "authenticated upload post-images" on storage.objects;
create policy "authenticated upload post-images" on storage.objects
  for insert to authenticated with check (bucket_id = 'post-images');

drop policy if exists "own delete post-images" on storage.objects;
create policy "own delete post-images" on storage.objects
  for delete to authenticated using (bucket_id = 'post-images' and owner = auth.uid());
