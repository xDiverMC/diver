// api/cron-maintenance.js — pembersihan order expired + retry pengiriman gagal (fitur 10 & 1).
// Dipanggil Vercel Cron (harian) dan/atau GitHub Actions (tiap 15 menit).
// Wajib header: Authorization: Bearer <CRON_SECRET>
import crypto from "node:crypto";
import { supabaseAdmin } from "./_lib/supabase.js";
import { deliverOrder, MAX_ATTEMPTS } from "./_lib/delivery.js";

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const a = Buffer.from(req.headers.authorization ?? "");
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ error: "Unauthorized" });

  const nowIso = new Date().toISOString();
  const dayAgoIso = new Date(Date.now() - 24 * 3600e3).toISOString();
  const staleIso = new Date(Date.now() - 10 * 60e3).toISOString();
  const report = {};

  try {
    // 1) Order UNPAID yang lewat batas waktu → EXPIRED
    const a = await supabaseAdmin.from("orders").update({ status: "EXPIRED" })
      .eq("status", "UNPAID").lt("expires_at", nowIso).select("id");
    const b = await supabaseAdmin.from("orders").update({ status: "EXPIRED" })
      .eq("status", "UNPAID").is("expires_at", null).lt("created_at", dayAgoIso).select("id");
    report.expired = (a.data?.length ?? 0) + (b.data?.length ?? 0);

    // 2) Pengiriman yang "nyangkut" (function mati di tengah jalan) → FAILED agar bisa dicoba lagi
    const stale = await supabaseAdmin.from("orders").update({ delivery_status: "FAILED" })
      .eq("delivery_status", "PROCESSING").lt("delivery_started_at", staleIso).select("id");
    report.unstuck = stale.data?.length ?? 0;

    // 3) Retry pengiriman gagal (maks MAX_ATTEMPTS kali)
    const { data: failed } = await supabaseAdmin.from("orders").select("merchant_ref")
      .eq("status", "PAID").eq("delivery_status", "FAILED").lt("delivery_attempts", MAX_ATTEMPTS)
      .order("created_at", { ascending: true }).limit(10);
    report.retried = [];
    for (const o of failed ?? []) {
      const r = await deliverOrder(o.merchant_ref, { from: ["FAILED"] });
      report.retried.push({ ref: o.merchant_ref, status: r.status ?? r.reason });
    }

    res.status(200).json({ ok: true, ...report });
  } catch (err) {
    console.error("cron-maintenance error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
