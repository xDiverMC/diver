# BDZONE Store

Website server Minecraft: React + Vite, Supabase, pembayaran Tripay, hosting Vercel.

## Fitur toko

| Fitur | Keterangan |
|---|---|
| Auto-delivery | Setelah bayar, item dikirim lewat RCON. Gagal → retry otomatis + tombol "Kirim ulang" di admin |
| Discord webhook | Order baru, pembayaran masuk, item terkirim, pengiriman gagal, refund |
| Email | Konfirmasi bayar + item terkirim (Resend) |
| Kupon | Persen / potongan tetap, kuota, kedaluwarsa, minimal belanja, 1x per player (`/admin/coupons`) |
| Top donatur | Dihitung dari order PAID (bulan ini & all time) |
| Cek pesanan | `/orders` — cari pakai username MC atau email, tanpa login |
| Batas pembelian | `max_qty`, `once_per_player`, `limit_total`, `limit_per_day` per produk |
| Order expired | Dibersihkan otomatis (cron) |

## Setup (urut)

1. **Database** — buka Supabase → SQL Editor, jalankan `supabase/001_features.sql` (aman diulang).
   Order lama otomatis ditandai agar *tidak* dikirim ulang oleh sistem baru.
2. **Env Vercel** — isi semua variabel di `.env.example` (Project → Settings → Environment Variables), lalu redeploy.
3. **RCON** di `server.properties` server Minecraft:
   ```
   enable-rcon=true
   rcon.port=25575
   rcon.password=<password panjang & acak>
   ```
   Port RCON harus bisa dijangkau dari internet (Vercel tidak punya IP tetap). RCON tidak
   terenkripsi, jadi pakai password panjang dan jangan pakai ulang di tempat lain.
   Kalau server di Pterodactyl, port RCON harus terdaftar sebagai allocation.
4. **Command produk** — di `/admin/store`, tambahkan `commands` ke tiap produk (lihat contoh di bawah).
   Produk **tanpa** `commands` tetap dikirim manual (status "Perlu kirim manual").
5. **Cron** — `vercel.json` sudah menjadwalkan pembersihan harian. Untuk tiap 15 menit, tambahkan secret
   repo GitHub `SITE_URL` dan `CRON_SECRET` (workflow `.github/workflows/maintenance.yml`).
6. **Discord** — Server Settings → Integrations → Webhooks → salin URL ke `DISCORD_WEBHOOK_URL`.
7. **Email** — daftar di resend.com, verifikasi domain, isi `RESEND_API_KEY` dan `EMAIL_FROM`.
8. **Admin** — matikan *Allow new users to sign up* di Supabase Auth (semua akun yang login dianggap admin),
   atau isi `ADMIN_EMAILS` untuk membatasi tombol "Kirim ulang".

## Contoh produk (`/admin/store`)

```json
[
  {
    "key": "vip", "name": "VIP", "price": "$4.99",
    "once_per_player": true,
    "commands": ["lp user {player} parent add vip"]
  }
]
```
```json
[
  {
    "key": "common", "name": "Common Key", "price": "$2.99",
    "max_qty": 10, "limit_per_day": 20,
    "commands": ["crate give {player} common {qty}"]
  }
]
```

Placeholder: `{player}` username, `{qty}` jumlah, `{ref}` kode order. `repeat_per_qty: true`
mengulang command sebanyak qty (dengan `{qty}`=1). Nama command di atas hanya contoh —
sesuaikan dengan plugin permission/crate/economy di servermu.

Pengiriman dianggap **gagal** jika output RCON mengandung "No player was found", "Unknown command",
dsb. (ubah lewat `DELIVERY_FAIL_REGEX`). Command yang butuh player online akan di-retry otomatis.

## Menjalankan lokal

`npm run dev` hanya menjalankan frontend. Untuk menguji folder `api/`, pakai `npx vercel dev`.
