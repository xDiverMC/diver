// api/admin.js — satu endpoint untuk semua kebutuhan panel admin (?action=...).
// Dibaca/ditulis lewat service role di server, jadi TIDAK bergantung pada RLS tabel di Supabase.
// Semua aksi wajib login admin (token Supabase di header Authorization).
import { supabaseAdmin, describeServiceKey, keyHasServerPrivileges } from "./_lib/supabase.js";
import { ApiError, sendError } from "./_lib/validate.js";
import { requireAdmin } from "./_lib/adminAuth.js";
import { loadCatalog } from "./_lib/pricing.js";
import { tripayBase } from "./_lib/tripay.js";
import { runRconCommands } from "./_lib/rcon.js";
import { logEvent } from "./_lib/logs.js";
import { sendDiscord, COLORS } from "./_lib/discord.js";
import {
  DISCORD_EVENTS,
  DISCORD_WEBHOOK_RE,
  getDiscordConfig,
  getSettings,
  saveSetting,
} from "./_lib/settings.js";

const HISTORY_DAYS = 180;
const DASH_COLS_FULL =
  "merchant_ref, created_at, paid_at, status, amount_idr, items, customer_mc_username, fulfilled, delivery_status";
const DASH_COLS_BASIC =
  "merchant_ref, created_at, status, amount_idr, items, customer_mc_username, fulfilled";

// Ubah error database jadi pesan yang bisa ditindaklanjuti.
function dbFail(prefix, error) {
  const k = describeServiceKey();
  if (error?.code === "42501" || /permission denied/i.test(error?.message ?? "")) {
    const why =
      k.kind === "anon" || k.kind === "publishable"
        ? "SUPABASE_SERVICE_ROLE_KEY di Vercel berisi kunci anon/publishable (kunci untuk browser), bukan service_role/secret."
        : k.kind === "missing"
          ? "SUPABASE_SERVICE_ROLE_KEY belum diisi di Vercel."
          : "Server tidak punya izin ke tabel ini.";
    return new ApiError(
      500,
      `${prefix}: izin ditolak. ${why} Buka Pengaturan → Cek sistem untuk langkah perbaikannya.`
    );
  }
  return new ApiError(500, `${prefix}: ${error?.message ?? "error tidak diketahui"}`);
}

async function countTodo() {
  const { count } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "PAID")
    .eq("fulfilled", false);
  return count ?? 0;
}

// ── Cek sistem ──────────────────────────────────────────────
const present = (v) => Boolean(String(v ?? "").trim());

async function runHealth({ rcon }) {
  const checks = [];
  const add = (id, title, status, detail, fix) => checks.push({ id, title, status, detail, fix });

  // 0) Kunci Supabase: penyebab paling umum "permission denied for table orders"
  const key = describeServiceKey();
  const keyLabel = {
    service_role: "Kunci service_role ✓",
    secret: "Kunci secret (sb_secret_…) ✓",
    anon: "Ini kunci ANON (untuk browser), bukan service_role",
    publishable: "Ini kunci PUBLISHABLE (untuk browser), bukan secret",
    missing: "Belum diisi",
    unknown: "Format kunci tidak dikenali",
  }[key.kind];
  add(
    "supabase-key",
    "Kunci Supabase di server (SUPABASE_SERVICE_ROLE_KEY)",
    keyHasServerPrivileges(key) ? "ok" : "fail",
    keyLabel,
    keyHasServerPrivileges(key)
      ? undefined
      : "Supabase → Project Settings → API: salin kunci 'service_role' (atau 'Secret key' sb_secret_…), BUKAN 'anon/publishable'. Tempel ke Vercel → Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY (tanpa spasi/tanda kutip), lalu Redeploy."
  );

  // 1) Environment
  const mode = process.env.TRIPAY_MODE === "sandbox" ? "sandbox" : "production";
  const envs = [
    ["TRIPAY_API_KEY", "Kunci API Tripay"],
    ["TRIPAY_PRIVATE_KEY", "Private key Tripay"],
    ["TRIPAY_MERCHANT_CODE", "Kode merchant Tripay"],
  ];
  const missingEnv = envs.filter(([k]) => !present(process.env[k])).map(([, l]) => l);
  add(
    "env-tripay",
    "Konfigurasi Tripay",
    missingEnv.length ? "fail" : "ok",
    missingEnv.length ? `Belum diisi: ${missingEnv.join(", ")}` : `Lengkap · mode ${mode}`,
    missingEnv.length ? "Isi di Vercel → Settings → Environment Variables, lalu Redeploy." : undefined
  );

  const site = String(process.env.PUBLIC_SITE_URL ?? "");
  add(
    "env-site",
    "Alamat situs (PUBLIC_SITE_URL)",
    /^https:\/\/[^/\s]+$/.test(site) ? "ok" : "fail",
    site || "Belum diisi",
    /^https:\/\/[^/\s]+$/.test(site)
      ? undefined
      : "Isi dengan alamat situs tanpa garis miring di akhir, contoh https://diver-delta.vercel.app. Dipakai Tripay untuk mengirim callback pembayaran."
  );

  add(
    "env-cron",
    "CRON_SECRET (pembersihan otomatis)",
    present(process.env.CRON_SECRET) ? "ok" : "warn",
    present(process.env.CRON_SECRET) ? "Terisi" : "Belum diisi — cron pembersihan & retry tidak akan jalan",
    present(process.env.CRON_SECRET) ? undefined : "Isi CRON_SECRET (teks acak panjang) di Vercel."
  );

  // 2) Database
  const tableChecks = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("delivery_status, delivery_log, paid_at, subtotal_idr, discount_idr, coupon_code, expires_at, mc_username_lower, customer_email_lower")
      .limit(1),
    supabaseAdmin.from("coupons").select("id").limit(1),
    supabaseAdmin.from("site_settings").select("key").limit(1),
    supabaseAdmin.from("system_logs").select("id").limit(1),
  ]);
  const [ordersCols, coupons, settings, logs] = tableChecks;
  const dbFix = "Buka Supabase → SQL Editor, tempel isi supabase/setup.sql, klik Run. Aman dijalankan ulang.";
  add(
    "db-orders",
    "Tabel orders (kolom baru)",
    ordersCols.error ? "fail" : "ok",
    ordersCols.error ? `Gagal membaca: ${ordersCols.error.message}` : "Lengkap",
    ordersCols.error
      ? /permission denied/i.test(ordersCols.error.message)
        ? "Ini masalah KUNCI Supabase (lihat pengecekan paling atas), bukan kolom. Perbaiki kuncinya dulu."
        : `Inilah penyebab pesanan tidak tersimpan saat checkout. ${dbFix}`
      : undefined
  );
  add("db-coupons", "Tabel kupon", coupons.error ? "fail" : "ok", coupons.error ? coupons.error.message : "Ada", coupons.error ? dbFix : undefined);
  add("db-settings", "Tabel pengaturan", settings.error ? "fail" : "ok", settings.error ? settings.error.message : "Ada", settings.error ? dbFix : undefined);
  add("db-logs", "Tabel log", logs.error ? "fail" : "ok", logs.error ? logs.error.message : "Ada", logs.error ? dbFix : undefined);

  const ordersTotal = await supabaseAdmin.from("orders").select("id", { count: "exact", head: true });
  add(
    "orders-count",
    "Jumlah pesanan tercatat",
    ordersTotal.error ? "fail" : "ok",
    ordersTotal.error ? ordersTotal.error.message : `${ordersTotal.count ?? 0} pesanan`,
    ordersTotal.count === 0
      ? "Belum ada pesanan. Kalau sudah mencoba checkout, lihat menu Log untuk alasan kegagalannya."
      : undefined
  );

  // 3) Katalog produk
  try {
    const catalog = await loadCatalog();
    const by = (cat) => catalog.filter((p) => p.category === cat).length;
    const counts = { ranks: by("ranks"), crate_keys: by("crate_keys"), currency_packs: by("currency_packs") };
    const total = catalog.length;
    add(
      "catalog",
      "Katalog produk di database",
      total === 0 ? "fail" : Object.values(counts).some((n) => n === 0) ? "warn" : "ok",
      `Ranks ${counts.ranks} · Crate ${counts.crate_keys} · Currency ${counts.currency_packs}`,
      total === 0
        ? "Katalog kosong → checkout selalu menolak produk. Buka Produk, lalu klik Simpan di tiap tab."
        : Object.values(counts).some((n) => n === 0)
          ? "Ada kategori yang belum tersimpan. Buka Produk → Simpan di tab tersebut."
          : undefined
    );
    const auto = catalog.filter((p) => Array.isArray(p.commands) && p.commands.length).length;
    add(
      "catalog-auto",
      "Produk dengan pengiriman otomatis",
      auto === 0 ? "warn" : "ok",
      `${auto} dari ${total} produk punya command RCON`,
      auto === 0 ? "Isi kolom 'Pengiriman otomatis' di Produk agar item terkirim sendiri. Tanpa itu, semua order dikirim manual." : undefined
    );
  } catch (err) {
    add("catalog", "Katalog produk di database", "fail", err.message, "Cek koneksi Supabase.");
  }

  // 4) Tripay (panggilan nyata)
  if (!missingEnv.length) {
    try {
      const r = await fetch(`${tripayBase()}/merchant/payment-channel`, {
        headers: { Authorization: `Bearer ${process.env.TRIPAY_API_KEY}` },
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      const active = (j.data ?? []).filter((c) => c.active).length;
      if (j.success && active > 0) add("tripay", "Koneksi ke Tripay", "ok", `${active} metode pembayaran aktif (mode ${mode})`);
      else
        add(
          "tripay",
          "Koneksi ke Tripay",
          "fail",
          j.success ? "Tidak ada metode pembayaran aktif" : j.message || `HTTP ${r.status}`,
          "Pastikan TRIPAY_MODE cocok dengan jenis API key (sandbox ≠ production), dan kosongkan IP Whitelist di dashboard Tripay."
        );
    } catch (err) {
      add("tripay", "Koneksi ke Tripay", "fail", err.message, "Tripay tidak terjangkau dari server.");
    }
  } else {
    add("tripay", "Koneksi ke Tripay", "skip", "Dilewati karena konfigurasi belum lengkap");
  }

  // 5) RCON (hanya kalau diminta — membuka koneksi ke server Minecraft)
  if (!present(process.env.RCON_HOST) || !present(process.env.RCON_PASSWORD)) {
    add("rcon", "RCON server Minecraft", "warn", "RCON_HOST / RCON_PASSWORD belum diisi", "Isi di Vercel + aktifkan enable-rcon=true di server.properties agar item terkirim otomatis.");
  } else if (!rcon) {
    add("rcon", "RCON server Minecraft", "skip", `${process.env.RCON_HOST}:${process.env.RCON_PORT || 25575} — klik “Tes RCON” untuk mencoba`);
  } else {
    try {
      const [res] = await runRconCommands(["list"]);
      add("rcon", "RCON server Minecraft", "ok", `Tersambung. Balasan server: ${String(res.output).slice(0, 80) || "(kosong)"}`);
    } catch (err) {
      add("rcon", "RCON server Minecraft", "fail", err.message, "Cek IP/port RCON, password, dan firewall (port RCON harus terbuka dari internet).");
    }
  }

  // 6) Notifikasi
  const dc = await getDiscordConfig();
  add(
    "discord",
    "Notifikasi Discord",
    dc.url && dc.enabled ? "ok" : "warn",
    dc.url ? (dc.enabled ? `Aktif (sumber: ${dc.source === "admin" ? "pengaturan admin" : "env Vercel"})` : "URL ada tapi dimatikan") : "Belum diatur",
    dc.url && dc.enabled ? undefined : "Isi URL webhook di Pengaturan → Notifikasi Discord."
  );
  add(
    "email",
    "Email konfirmasi (Resend)",
    present(process.env.RESEND_API_KEY) && present(process.env.EMAIL_FROM) ? "ok" : "warn",
    present(process.env.RESEND_API_KEY) && present(process.env.EMAIL_FROM) ? "Terisi" : "RESEND_API_KEY / EMAIL_FROM belum diisi (opsional)"
  );

  return checks;
}

// ── Handler ────────────────────────────────────────────────
export default async function handler(req, res) {
  try {
    await requireAdmin(req);
    const action = String(req.query.action ?? "");
    const method = req.method;
    const needPost = () => {
      if (method !== "POST") throw new ApiError(405, "Gunakan POST.");
    };
    res.setHeader("Cache-Control", "no-store");

    switch (action) {
      case "summary": {
        return res.status(200).json({ todo: await countTodo() });
      }

      case "orders": {
        const { data, error } = await supabaseAdmin
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw dbFail("Gagal membaca pesanan", error);
        return res.status(200).json({ orders: data ?? [] });
      }

      case "dashboard": {
        const since = new Date(Date.now() - HISTORY_DAYS * 86400e3).toISOString();
        let schemaOutdated = false;
        let rows;
        const run = (cols) =>
          supabaseAdmin
            .from("orders")
            .select(cols)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(5000);
        let r = await run(DASH_COLS_FULL);
        if (r.error) {
          // Kolom baru belum ada (SQL belum dijalankan): tetap tampilkan dashboard.
          schemaOutdated = true;
          r = await run(DASH_COLS_BASIC);
        }
        if (r.error) throw dbFail("Gagal membaca pesanan", r.error);
        rows = r.data ?? [];

        const { data: cat } = await supabaseAdmin
          .from("store_content")
          .select("key")
          .in("key", ["ranks", "crate_keys", "currency_packs"]);
        return res.status(200).json({
          orders: rows,
          todo: await countTodo(),
          catalogMissing: (cat?.length ?? 0) < 3,
          schemaOutdated,
        });
      }

      case "fulfill": {
        needPost();
        const id = req.body?.id;
        if (!id) throw new ApiError(400, "id wajib diisi.");
        const patch = { fulfilled: true, delivery_status: "DELIVERED", delivered_at: new Date().toISOString() };
        let { error } = await supabaseAdmin.from("orders").update(patch).eq("id", id);
        if (error) ({ error } = await supabaseAdmin.from("orders").update({ fulfilled: true }).eq("id", id)); // skema lama
        if (error) throw new ApiError(500, error.message);
        await logEvent("info", "admin", `Order #${id} ditandai terkirim manual`);
        return res.status(200).json({ ok: true });
      }

      case "logs": {
        const level = String(req.query.level ?? "all");
        let q = supabaseAdmin
          .from("system_logs")
          .select("id, created_at, level, source, message, meta")
          .order("created_at", { ascending: false })
          .limit(Math.min(Number(req.query.limit) || 100, 300));
        if (["info", "warn", "error"].includes(level)) q = q.eq("level", level);
        const { data, error } = await q;
        if (error) {
          return res.status(200).json({ logs: [], tableMissing: true, error: error.message });
        }
        return res.status(200).json({ logs: data ?? [] });
      }

      case "logs-clear": {
        needPost();
        const { error } = await supabaseAdmin.from("system_logs").delete().gte("id", 0);
        if (error) throw new ApiError(500, error.message);
        return res.status(200).json({ ok: true });
      }

      case "settings": {
        const dc = await getDiscordConfig();
        const s = await getSettings({ force: true });
        return res.status(200).json({
          discord: {
            enabled: dc.enabled,
            hasUrl: Boolean(dc.url),
            source: dc.source,
            urlPreview: dc.url ? `…${dc.url.slice(-8)}` : "",
            events: dc.events,
          },
          eventsList: DISCORD_EVENTS,
          saved: Boolean(s.discord),
        });
      }

      case "settings-save": {
        needPost();
        const input = req.body?.discord ?? {};
        const current = (await getSettings({ force: true })).discord ?? {};
        const next = { ...current };

        if (typeof input.url === "string") {
          const url = input.url.trim();
          if (url && !DISCORD_WEBHOOK_RE.test(url)) {
            throw new ApiError(400, "URL tidak valid. Harus berbentuk https://discord.com/api/webhooks/…");
          }
          next.url = url;
        }
        if (typeof input.enabled === "boolean") next.enabled = input.enabled;
        if (input.events && typeof input.events === "object") {
          next.events = Object.fromEntries(DISCORD_EVENTS.map((e) => [e.key, input.events[e.key] !== false]));
        }

        const error = await saveSetting("discord", next);
        if (error) {
          throw new ApiError(
            500,
            `Gagal menyimpan: ${error.message}. Jalankan supabase/setup.sql di Supabase SQL Editor dulu.`
          );
        }
        return res.status(200).json({ ok: true });
      }

      case "discord-test": {
        needPost();
        const dc = await getDiscordConfig();
        if (!dc.url) throw new ApiError(400, "Belum ada URL webhook. Isi dan simpan dulu.");
        const r = await sendDiscord(dc.url, {
          title: "✅ Tes notifikasi SiestaNet",
          description: "Kalau pesan ini muncul, webhook Discord sudah tersambung.",
          color: COLORS.success,
        });
        if (!r.ok) throw new ApiError(502, `Gagal mengirim ke Discord: ${r.error}`);
        return res.status(200).json({ ok: true });
      }

      case "health": {
        return res.status(200).json({
          checks: await runHealth({ rcon: req.query.rcon === "1" }),
          ranAt: new Date().toISOString(),
        });
      }

      default:
        throw new ApiError(400, "Aksi tidak dikenal.");
    }
  } catch (err) {
    sendError(res, err);
  }
}
