# SiestaNet Store

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
| Halaman legal | `/terms`, `/privacy`, `/refund` (draf bahasa Indonesia di `src/pages/legal/legalContent.js` — baca & sesuaikan). Checkout meminta persetujuan |
| Statistik toko | "Total raised", donatur, dan target bulanan dihitung dari pesanan PAID asli (`/api/store-stats`). Target diatur di Admin → Pengaturan |
| Upload gambar | Form berita bisa upload gambar (dikecilkan di browser, disimpan di Supabase Storage bucket `site-images`, dibuat otomatis) |
| Panel admin | Tema terang. Dashboard + grafik, produk, pesanan, kupon, berita, **Log**, **Pengaturan** (Discord + cek sistem) |

## Setup (urut)

1. **Database** — buka Supabase → SQL Editor, tempel isi `supabase/setup.sql` lalu **Run** (aman diulang).
   Order lama otomatis ditandai agar *tidak* dikirim ulang oleh sistem baru.
   (`setup.sql` = gabungan `001_features.sql` + `002_settings_logs.sql`.)
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
4. **Produk** — buka `/admin/store`, lalu **Simpan** di tiap tab (Ranks, Crate Keys, Currency) agar katalog
   tersimpan di database (checkout hanya memproses produk yang tersimpan). Isi kolom *Pengiriman otomatis*
   tiap produk dengan command RCON. Produk tanpa command tetap dikirim manual.
5. **Cron** — `vercel.json` sudah menjadwalkan pembersihan harian. Untuk tiap 15 menit, tambahkan secret
   repo GitHub `SITE_URL` dan `CRON_SECRET` (workflow `.github/workflows/maintenance.yml`).
6. **Discord** — cukup tempel URL webhook di **Admin → Pengaturan → Notifikasi Discord**, klik Simpan lalu *Kirim tes*.
   Event bisa dinyalakan/dimatikan satu per satu. (`DISCORD_WEBHOOK_URL` di Vercel hanya cadangan.)
7. **Email** — daftar di resend.com, verifikasi domain, isi `RESEND_API_KEY` dan `EMAIL_FROM`.
8. **Admin** — matikan *Allow new users to sign up* di Supabase Auth (semua akun yang login dianggap admin),
   atau isi `ADMIN_EMAILS` untuk membatasi tombol "Kirim ulang".

## Contoh command produk (kolom *Pengiriman otomatis*)

Satu command per baris:

```
lp user {player} parent add vip          ← rank
crate give {player} common {qty}         ← crate key (jumlah = {qty})
eco give {player} 10000                  ← currency; centang "ulangi sesuai jumlah"
```

Placeholder: `{player}` username, `{qty}` jumlah, `{ref}` kode order. `repeat_per_qty: true`
mengulang command sebanyak qty (dengan `{qty}`=1). Nama command di atas hanya contoh —
sesuaikan dengan plugin permission/crate/economy di servermu.

Pengiriman dianggap **gagal** jika output RCON mengandung "No player was found", "Unknown command",
dsb. (ubah lewat `DELIVERY_FAIL_REGEX`). Command yang butuh player online akan di-retry otomatis.

## Yang perlu diisi sendiri

Di `src/config/site.js`: `SERVER_JAVA_ADDRESS`, `SERVER_BEDROCK_ADDRESS`, `CONTACT_EMAIL`, `DISCORD_INVITE_URL`, dan `SOCIAL_LINKS`
(sosial media yang kosong disembunyikan dari footer). Ganti juga logo `src/assets/Logo/bd-zone-two.png`.
Halaman `/votes` masih memakai data contoh (belum ada backend vote).

## "permission denied for table ..."?

Jalankan `supabase/grants.sql` di Supabase SQL Editor (aman diulang). Proyek Supabase baru tidak memberi izin tabel
otomatis, jadi server (`service_role`), pengunjung (`anon`), dan admin (`authenticated`) perlu diberi izin eksplisit.
Catatan: isi `commands` produk ikut terbaca publik karena katalog dibaca langsung oleh website.

## Pesanan tidak muncul / ada yang tidak jalan?

Buka **Admin → Pengaturan → Cek sistem**. Halaman itu memeriksa env, tabel database, katalog produk, Tripay, dan RCON,
lengkap dengan cara memperbaikinya. **Admin → Log** menampilkan alasan tiap kegagalan checkout, callback, dan pengiriman.

## Metode pembayaran tidak muncul?

Halaman checkout sekarang menampilkan alasannya. Penyebab paling umum:

1. `TRIPAY_MODE` tidak cocok dengan API key (key sandbox ≠ key production). Isi `sandbox` atau `production`.
2. `TRIPAY_API_KEY` belum diisi di Vercel, atau lupa **Redeploy** setelah mengisi.
3. *IP Whitelist* di dashboard Tripay terisi — kosongkan, karena IP Vercel berubah-ubah.

## Menjalankan lokal

`npm run dev` hanya menjalankan frontend. Untuk menguji folder `api/`, pakai `npx vercel dev`.
