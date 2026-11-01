// api/_lib/coupons.js — validasi & hitung diskon kupon (fitur 4).
import { supabaseAdmin } from "./supabase.js";
import { ApiError, formatIDR } from "./validate.js";
import { MIN_TOTAL_IDR } from "./pricing.js";

const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

export function normalizeCode(code) {
  return String(code ?? "").trim().toUpperCase();
}

export async function resolveCoupon(rawCode, subtotalIdr, player) {
  const code = normalizeCode(rawCode);
  if (!CODE_RE.test(code)) throw new ApiError(400, "Format kode kupon tidak valid.");

  const { data: c, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error("Gagal cek kupon: " + error.message);
  if (!c || !c.active) throw new ApiError(400, "Kupon tidak ditemukan atau tidak aktif.");

  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
    throw new ApiError(400, "Kupon sudah kedaluwarsa.");
  }
  if (c.max_uses != null && c.used_count >= c.max_uses) {
    throw new ApiError(400, "Kuota kupon sudah habis.");
  }
  if (subtotalIdr < (c.min_order_idr || 0)) {
    throw new ApiError(400, `Minimal belanja ${formatIDR(c.min_order_idr)} untuk kupon ini.`);
  }

  if (c.one_per_player) {
    if (!player) throw new ApiError(400, "Isi username Minecraft dulu untuk memakai kupon ini.");
    const { data: used } = await supabaseAdmin
      .from("orders")
      .select("status, created_at, expires_at")
      .eq("coupon_code", code)
      .eq("mc_username_lower", player.toLowerCase())
      .in("status", ["PAID", "UNPAID"]);
    const now = Date.now();
    const already = (used ?? []).some((o) => {
      if (o.status === "PAID") return true;
      const exp = o.expires_at
        ? new Date(o.expires_at).getTime()
        : new Date(o.created_at).getTime() + 24 * 3600e3;
      return exp > now;
    });
    if (already) throw new ApiError(400, "Kupon ini hanya bisa dipakai sekali per player.");
  }

  let discount =
    c.type === "percent"
      ? Math.floor((subtotalIdr * Math.min(c.value, 100)) / 100)
      : c.value;
  if (c.type === "percent" && c.max_discount_idr) {
    discount = Math.min(discount, c.max_discount_idr);
  }
  // Total akhir tidak boleh di bawah batas minimum payment gateway.
  discount = Math.max(0, Math.min(discount, subtotalIdr - MIN_TOTAL_IDR));
  if (discount <= 0) throw new ApiError(400, "Kupon tidak memberi diskon untuk pesanan ini.");

  return {
    code,
    discountIdr: discount,
    label:
      c.type === "percent"
        ? `Diskon ${c.value}%${c.max_discount_idr ? ` (maks ${formatIDR(c.max_discount_idr)})` : ""}`
        : `Potongan ${formatIDR(c.value)}`,
  };
}
