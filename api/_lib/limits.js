// api/_lib/limits.js — pembatasan pembelian per player (fitur 9).
// Field opsional per produk di store_content (diedit lewat /admin/store):
//   max_qty          : maksimal qty per pesanan (default 99)
//   once_per_player  : true → hanya boleh dibeli satu kali seumur hidup
//   limit_total      : batas total qty per player (seumur hidup)
//   limit_per_day    : batas qty per player per hari
import { supabaseAdmin } from "./supabase.js";
import { ApiError, startOfDayUtc } from "./validate.js";

function isActiveOrder(o, now) {
  if (o.status === "PAID") return true;
  if (o.status !== "UNPAID") return false;
  // UNPAID yang belum kedaluwarsa dihitung supaya tidak bisa "spam" checkout.
  const exp = o.expires_at
    ? new Date(o.expires_at).getTime()
    : new Date(o.created_at).getTime() + 24 * 3600e3;
  return exp > now;
}

export async function checkPurchaseLimits({ lines, player }) {
  const limited = lines.filter(
    (l) => l.product.once_per_player || l.product.limit_total || l.product.limit_per_day
  );
  if (limited.length === 0) return;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("items, status, created_at, expires_at")
    .eq("mc_username_lower", player.toLowerCase())
    .in("status", ["PAID", "UNPAID"]);
  if (error) throw new Error("Gagal cek batas pembelian: " + error.message);

  const now = Date.now();
  const dayStart = startOfDayUtc().getTime();
  const total = new Map();
  const today = new Map();

  for (const o of data ?? []) {
    if (!isActiveOrder(o, now)) continue;
    const isToday = new Date(o.created_at).getTime() >= dayStart;
    for (const it of o.items ?? []) {
      const q = Number(it.quantity) || 1;
      total.set(it.sku, (total.get(it.sku) ?? 0) + q);
      if (isToday) today.set(it.sku, (today.get(it.sku) ?? 0) + q);
    }
  }

  for (const { product, sku, name, qty } of limited) {
    const have = total.get(sku) ?? 0;
    const haveToday = today.get(sku) ?? 0;

    if (product.once_per_player && (have > 0 || qty > 1)) {
      throw new ApiError(
        400,
        have > 0
          ? `${name} hanya bisa dibeli satu kali per player, dan akun ${player} sudah punya/pernah memesannya.`
          : `${name} hanya bisa dibeli satu kali per player (qty harus 1).`
      );
    }
    if (product.limit_total && have + qty > Number(product.limit_total)) {
      throw new ApiError(
        400,
        `${name}: batas pembelian ${product.limit_total} per player (sudah ${have}).`
      );
    }
    if (product.limit_per_day && haveToday + qty > Number(product.limit_per_day)) {
      throw new ApiError(
        400,
        `${name}: batas ${product.limit_per_day} per hari untuk satu player (hari ini sudah ${haveToday}).`
      );
    }
  }
}
