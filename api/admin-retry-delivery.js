// api/admin-retry-delivery.js — tombol "Kirim ulang" di /admin/orders.
import { ApiError, sendError } from "./_lib/validate.js";
import { requireAdmin } from "./_lib/adminAuth.js";
import { deliverOrder } from "./_lib/delivery.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    await requireAdmin(req);
    const ref = String(req.body?.ref ?? "");
    if (!ref) throw new ApiError(400, "ref wajib diisi.");

    const result = await deliverOrder(ref, { from: ["PENDING", "FAILED", "MANUAL"] });
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err);
  }
}
