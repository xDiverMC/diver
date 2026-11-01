// api/admin-retry-delivery.js — tombol "Kirim ulang" di /admin/orders.
// Verifikasi token login Supabase; batasi ke ADMIN_EMAILS kalau diisi.
import { supabaseAdmin } from "./_lib/supabase.js";
import { ApiError, sendError } from "./_lib/validate.js";
import { deliverOrder } from "./_lib/delivery.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (!token) throw new ApiError(401, "Belum login.");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) throw new ApiError(401, "Sesi tidak valid.");

    const allow = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allow.length && !allow.includes((data.user.email ?? "").toLowerCase())) {
      throw new ApiError(403, "Akun ini bukan admin.");
    }

    const ref = String(req.body?.ref ?? "");
    if (!ref) throw new ApiError(400, "ref wajib diisi.");

    const result = await deliverOrder(ref, { from: ["PENDING", "FAILED", "MANUAL"] });
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err);
  }
}
