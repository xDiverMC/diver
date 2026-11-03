// api/_lib/logs.js — catat kejadian penting ke tabel system_logs (tampil di /admin/logs).
// Tidak pernah melempar error: kalau tabel belum ada, diam-diam diabaikan.
import { supabaseAdmin } from "./supabase.js";

export async function logEvent(level, source, message, meta) {
  try {
    await supabaseAdmin.from("system_logs").insert({
      level,
      source: String(source).slice(0, 40),
      message: String(message ?? "").slice(0, 500),
      meta: meta ?? null,
    });
  } catch (err) {
    console.error("logEvent gagal:", err?.message);
  }
}
