// api/validate-coupon.js — dipakai Checkout untuk pratinjau diskon.
import { ApiError, MC_USERNAME_RE, sendError, formatIDR } from "./_lib/validate.js";
import { priceCart, MIN_TOTAL_IDR } from "./_lib/pricing.js";
import { resolveCoupon } from "./_lib/coupons.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { code, items, customer_mc_username } = req.body ?? {};
    if (!code) throw new ApiError(400, "Masukkan kode kupon.");
    const player = MC_USERNAME_RE.test(String(customer_mc_username ?? "")) ? customer_mc_username : null;

    const { subtotalIdr } = await priceCart(items);
    const c = await resolveCoupon(code, subtotalIdr, player);

    res.status(200).json({
      code: c.code,
      label: c.label,
      subtotal_idr: subtotalIdr,
      discount_idr: c.discountIdr,
      total_idr: Math.max(MIN_TOTAL_IDR, subtotalIdr - c.discountIdr),
      message: `${c.label} — hemat ${formatIDR(c.discountIdr)}`,
    });
  } catch (err) {
    sendError(res, err);
  }
}
