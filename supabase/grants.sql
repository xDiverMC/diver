-- ─────────────────────────────────────────────────────────────
-- grants.sql — izin akses tabel untuk API Supabase. Aman diulang.
--
-- Kenapa perlu: project Supabase baru TIDAK lagi memberi izin otomatis ke tabel
-- yang dibuat lewat SQL Editor, sehingga muncul "permission denied for table ...".
-- ─────────────────────────────────────────────────────────────

-- 1) Server (service_role): akses penuh — dipakai checkout, callback Tripay, API admin.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

-- 2) Pengunjung website (anon): hanya BACA konten publik. Pesanan TIDAK bisa dibaca.
-- 3) Admin yang sudah login (authenticated): kelola konten & kupon dari panel admin.
--    (Tabel yang belum ada dilewati, tidak error.)
grant usage on schema public to anon;
grant usage on schema public to authenticated;
do $$
declare t text;
begin
  foreach t in array array['store_content', 'news_posts', 'staff_members'] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select on public.%I to anon', t);
    end if;
  end loop;
  foreach t in array array['store_content', 'news_posts', 'staff_members', 'coupons'] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    end if;
  end loop;
end $$;
