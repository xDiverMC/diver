// api/_lib/settings.js — pengaturan yang bisa diubah dari panel admin (tanpa redeploy).
import { supabaseAdmin } from "./supabase.js";

const TTL_MS = 30_000;
let cache = null;
let cachedAt = 0;

export async function getSettings({ force = false } = {}) {
  if (!force && cache && Date.now() - cachedAt < TTL_MS) return cache;
  const out = {};
  try {
    const { data } = await supabaseAdmin.from("site_settings").select("key, value");
    for (const row of data ?? []) out[row.key] = row.value;
  } catch {
    // tabel belum ada → pakai default / env
  }
  cache = out;
  cachedAt = Date.now();
  return out;
}

export async function saveSetting(key, value) {
  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  cache = null;
  return error;
}

export const DISCORD_EVENTS = [
  { key: "new_order", label: "Order baru (menunggu pembayaran)" },
  { key: "paid", label: "Pembayaran masuk" },
  { key: "delivered", label: "Item terkirim otomatis" },
  { key: "failed", label: "Pengiriman gagal" },
  { key: "manual", label: "Perlu kirim manual" },
  { key: "refund", label: "Refund" },
];

// Webhook Discord: dari pengaturan admin, cadangan ke env DISCORD_WEBHOOK_URL.
export async function getDiscordConfig() {
  const s = (await getSettings()).discord ?? {};
  const events = Object.fromEntries(DISCORD_EVENTS.map((e) => [e.key, true]));
  if (process.env.DISCORD_NOTIFY_NEW_ORDER === "false") events.new_order = false;
  Object.assign(events, s.events ?? {});
  return {
    url: String(s.url || process.env.DISCORD_WEBHOOK_URL || "").trim(),
    source: s.url ? "admin" : process.env.DISCORD_WEBHOOK_URL ? "env" : "none",
    enabled: s.enabled !== false,
    events,
  };
}

// Hanya webhook Discord resmi yang diterima (mencegah server dipakai menembak URL lain).
export const DISCORD_WEBHOOK_RE =
  /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;
