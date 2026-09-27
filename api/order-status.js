// api/order-status.js
// Dipakai halaman /order/:ref buat nampilin status pembayaran, tanpa
// perlu buka akses baca tabel orders ke publik.
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://wyvninaekoahdwichgmw.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: "Missing ref" });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("merchant_ref, status, amount_idr, items, customer_mc_username")
    .eq("merchant_ref", ref)
    .maybeSingle();

  if (error || !data) return res.status(404).json({ error: "Order not found" });

  res.status(200).json(data);
}
