// api/create-transaction.js
// Alur: validasi → hitung harga di server → cek batas beli → kupon → Tripay → simpan order.
import crypto from "node:crypto";
import { supabaseAdmin } from "./_lib/supabase.js";
import { ApiError, MC_USERNAME_RE, EMAIL_RE, sendError } from "./_lib/validate.js";
import { priceCart, toOrderItems } from "./_lib/pricing.js";
import { checkPurchaseLimits } from "./_lib/limits.js";
import { resolveCoupon } from "./_lib/coupons.js";
import { notifyDiscord, orderFields, COLORS } from "./_lib/discord.js";

const ORDER_TTL_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body ?? {};
    const name = String(body.customer_name ?? "").trim().slice(0, 80);
    const email = String(body.customer_email ?? "").trim().toLowerCase().slice(0, 120);
    const player = String(body.customer_mc_username ?? "").trim();
    const method = String(body.method ?? "").trim();

    if (!name) throw new ApiError(400, "Nama wajib diisi.");
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "Email tidak valid.");
    if (!MC_USERNAME_RE.test(player)) {
      throw new ApiError(
        400,
        "Username Minecraft tidak valid (3–16 karakter: huruf, angka, underscore; pemain Bedrock diawali titik)."
      );
    }
    if (!method) throw new ApiError(400, "Pilih metode pembayaran dulu.");

    // Harga dihitung ulang dari database — JANGAN percaya harga dari client.
    const { lines, subtotalIdr } = await priceCart(body.items);
    await checkPurchaseLimits({ lines, player });

    let discountIdr = 0;
    let couponCode = null;
    if (body.coupon_code) {
      const c = await resolveCoupon(body.coupon_code, subtotalIdr, player);
      discountIdr = c.discountIdr;
      couponCode = c.code;
    }

    const amountIdr = subtotalIdr - discountIdr;
    const orderItems = toOrderItems(lines);
    const merchantRef = `BDZ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Tripay mewajibkan amount == jumlah(price × qty) item. Kalau ada diskon,
    // kirim satu baris ringkasan; rincian asli tetap disimpan di database kita.
    const tripayItems =
      discountIdr > 0
        ? [{ sku: "ORDER", name: `Pesanan BDZONE (kupon ${couponCode})`, price: amountIdr, quantity: 1 }]
        : orderItems;

    const merchantCode = process.env.TRIPAY_MERCHANT_CODE;
    const signature = crypto
      .createHmac("sha256", process.env.TRIPAY_PRIVATE_KEY)
      .update(merchantCode + merchantRef + amountIdr)
      .digest("hex");

    const expiresAt = new Date(Date.now() + ORDER_TTL_MS);
    const tripayRes = await fetch("https://tripay.co.id/api/transaction/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TRIPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method,
        merchant_ref: merchantRef,
        amount: amountIdr,
        customer_name: name,
        customer_email: email,
        order_items: tripayItems,
        callback_url: `${process.env.PUBLIC_SITE_URL}/api/tripay-callback`,
        return_url: `${process.env.PUBLIC_SITE_URL}/order/${merchantRef}`,
        expired_time: Math.floor(expiresAt.getTime() / 1000),
        signature,
      }),
    });
    const tripayJson = await tripayRes.json();
    if (!tripayJson.success) {
      throw new ApiError(400, tripayJson.message || "Tripay menolak transaksi");
    }

    const row = {
      merchant_ref: merchantRef,
      tripay_reference: tripayJson.data.reference,
      status: "UNPAID",
      customer_name: name,
      customer_email: email,
      customer_mc_username: player,
      items: orderItems,
      subtotal_idr: subtotalIdr,
      discount_idr: discountIdr,
      coupon_code: couponCode,
      amount_idr: amountIdr,
      payment_method: method,
      checkout_url: tripayJson.data.checkout_url,
      expires_at: expiresAt.toISOString(),
      delivery_status: "PENDING",
    };
    const { error: insertError } = await supabaseAdmin.from("orders").insert(row);
    if (insertError) {
      console.error("Gagal simpan order", merchantRef, insertError);
      throw new ApiError(500, "Gagal menyimpan pesanan. Jangan bayar dulu, coba lagi.");
    }

    if (process.env.DISCORD_NOTIFY_NEW_ORDER !== "false") {
      await notifyDiscord({
        title: "🛒 Order baru (menunggu pembayaran)",
        color: COLORS.info,
        fields: orderFields(row),
      });
    }

    res.status(200).json({ checkout_url: tripayJson.data.checkout_url });
  } catch (err) {
    sendError(res, err);
  }
}
