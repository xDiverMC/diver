// api/order-status.js
// Dipakai halaman /order/:ref buat nampilin status pembayaran & pengiriman,
// tanpa perlu buka akses baca tabel orders ke publik.
import { supabaseAdmin } from "./_lib/supabase.js";

export default async function handler(req, res) {
  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: "Missing ref" });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, merchant_ref, status, amount_idr, discount_idr, coupon_code, items, customer_mc_username, delivery_status, fulfilled, expires_at, created_at"
    )
    .eq("merchant_ref", ref)
    .maybeSingle();

  if (error || !data) return res.status(404).json({ error: "Order not found" });

  // Lazy-expire: order UNPAID yang lewat batas waktu langsung tampil EXPIRED.
  const expMs = data.expires_at
    ? new Date(data.expires_at).getTime()
    : new Date(data.created_at).getTime() + 24 * 3600e3;
  if (data.status === "UNPAID" && expMs < Date.now()) {
    await supabaseAdmin.from("orders").update({ status: "EXPIRED" }).eq("id", data.id).eq("status", "UNPAID");
    data.status = "EXPIRED";
  }

  const { id: _id, expires_at: _e, created_at: _c, ...publicFields } = data;
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(publicFields);
}
