// api/my-orders.js — cek riwayat order tanpa login (fitur 8).
// Cari berdasarkan username Minecraft ATAU email. Hanya mengembalikan data non-sensitif
// (tanpa nama/email), maksimal 10 order terbaru.
import { supabaseAdmin } from "./_lib/supabase.js";
import { ApiError, MC_USERNAME_RE, EMAIL_RE, sendError } from "./_lib/validate.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const q = String(req.body?.query ?? "").trim().toLowerCase();
    let column;
    if (EMAIL_RE.test(q)) column = "customer_email_lower";
    else if (MC_USERNAME_RE.test(q)) column = "mc_username_lower";
    else throw new ApiError(400, "Masukkan username Minecraft atau email yang valid.");

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("merchant_ref, status, delivery_status, amount_idr, items, created_at, expires_at")
      .eq(column, q)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;

    const now = Date.now();
    const orders = (data ?? []).map((o) => {
      const expMs = o.expires_at ? new Date(o.expires_at).getTime() : new Date(o.created_at).getTime() + 24 * 3600e3;
      const status = o.status === "UNPAID" && expMs < now ? "EXPIRED" : o.status;
      return {
        merchant_ref: o.merchant_ref,
        status,
        delivery_status: o.delivery_status,
        amount_idr: o.amount_idr,
        created_at: o.created_at,
        items: (o.items ?? []).map((i) => ({ name: i.name, quantity: i.quantity })),
      };
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ orders });
  } catch (err) {
    sendError(res, err);
  }
}
