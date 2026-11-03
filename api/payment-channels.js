// api/payment-channels.js — proxy daftar metode pembayaran Tripay
// (API key tidak pernah sampai ke browser). Selalu membalas pesan error yang jelas.
import { tripayBase } from "./_lib/tripay.js";
import { logEvent } from "./_lib/logs.js";

export default async function handler(req, res) {
  try {
    const key = process.env.TRIPAY_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "TRIPAY_API_KEY belum diisi di Vercel (Settings → Environment Variables), lalu Redeploy." });
    }

    const response = await fetch(`${tripayBase()}/merchant/payment-channel`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });

    let json;
    try {
      json = await response.json();
    } catch {
      return res.status(502).json({ error: `Tripay membalas dengan format tak terduga (HTTP ${response.status}).` });
    }

    if (!json.success) {
      await logEvent("warn", "tripay", `Daftar metode pembayaran ditolak Tripay: ${json.message}`);
      return res.status(400).json({
        error: `${json.message || "Tripay menolak permintaan"} — cek TRIPAY_MODE (sandbox/production) cocok dengan API key, dan kosongkan IP Whitelist di dashboard Tripay.`,
      });
    }

    const channels = (json.data ?? [])
      .filter((c) => c.active)
      .map((c) => ({
        code: c.code,
        name: c.name,
        group: c.group,
        icon_url: c.icon_url,
        fee_customer: c.fee_customer,
      }));

    if (channels.length === 0) {
      return res.status(200).json({ channels, warning: "Tripay tidak mengembalikan metode pembayaran aktif." });
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ channels });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Tidak bisa menghubungi Tripay: " + err.message });
  }
}
