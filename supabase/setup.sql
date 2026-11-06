-- setup.sql — jalankan SEKALI di Supabase → SQL Editor (gabungan 001 + 002). Aman diulang.


-- 1) Order lama: tandai supaya TIDAK dikirim otomatis oleh sistem baru.
--    (Hanya jalan kalau kolom delivery_status belum ada = migrasi pertama.)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'delivery_status'
  ) then
    alter table public.orders add column delivery_status text not null default 'PENDING';
    update public.orders
       set delivery_status = case when coalesce(fulfilled, false) then 'DELIVERED' else 'MANUAL' end;
  end if;
end $$;

-- 2) Kolom baru di orders
alter table public.orders
  add column if not exists fulfilled boolean not null default false,
  add column if not exists expires_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists delivery_started_at timestamptz,
  add column if not exists delivery_attempts int not null default 0,
  add column if not exists delivery_log jsonb not null default '[]'::jsonb,
  add column if not exists coupon_code text,
  add column if not exists subtotal_idr int,
  add column if not exists discount_idr int not null default 0;

-- Kolom bantu (lowercase) untuk pencarian & batas pembelian
alter table public.orders
  add column if not exists mc_username_lower text
    generated always as (lower(customer_mc_username)) stored,
  add column if not exists customer_email_lower text
    generated always as (lower(customer_email)) stored;

create index if not exists orders_mc_lower_idx   on public.orders (mc_username_lower);
create index if not exists orders_email_lower_idx on public.orders (customer_email_lower);
create index if not exists orders_status_idx     on public.orders (status, created_at);
create index if not exists orders_delivery_idx   on public.orders (delivery_status);

-- 3) Kupon
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  type text not null check (type in ('percent', 'fixed')),
  value int not null check (value > 0),          -- percent: 1-100, fixed: Rupiah
  max_discount_idr int,                          -- batas diskon (untuk percent)
  min_order_idr int not null default 0,
  max_uses int,                                  -- null = tanpa batas
  used_count int not null default 0,
  one_per_player boolean not null default false,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

-- Hanya admin (user yang login) yang boleh kelola kupon dari panel.
-- Publik/anon TIDAK bisa baca tabel ini; validasi kupon lewat /api/validate-coupon.
drop policy if exists "coupons admin all" on public.coupons;
create policy "coupons admin all" on public.coupons
  for all to authenticated using (true) with check (true);

-- Tambah pemakaian kupon secara atomik (dipanggil server saat order PAID)
create or replace function public.redeem_coupon(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.coupons set used_count = used_count + 1 where code = upper(p_code);
$$;

revoke execute on function public.redeem_coupon(text) from public, anon, authenticated;
grant execute on function public.redeem_coupon(text) to service_role;

-- Pengaturan situs (mis. URL webhook Discord). RLS aktif TANPA policy:
-- tidak bisa dibaca dari browser, hanya oleh server (service role).
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

-- Log kejadian penting: order dibuat, callback pembayaran, pengiriman, error.
create table if not exists public.system_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  source text not null,
  message text not null,
  meta jsonb
);
create index if not exists system_logs_created_idx on public.system_logs (created_at desc);
create index if not exists system_logs_level_idx on public.system_logs (level, created_at desc);
alter table public.system_logs enable row level security;

-- 6) Izin akses tabel (lihat grants.sql)
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
