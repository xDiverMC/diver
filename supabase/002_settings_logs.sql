-- ─────────────────────────────────────────────────────────────
-- 002_settings_logs.sql — pengaturan (Discord webhook) + log sistem.
-- Aman dijalankan ulang. Dijalankan SETELAH 001_features.sql
-- (atau pakai setup.sql yang sudah menggabungkan keduanya).
-- ─────────────────────────────────────────────────────────────

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
