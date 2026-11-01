// api/tripay-callback.js
// Tripay "mengetuk" endpoint ini tiap status pembayaran berubah.
// Verifikasi signature dulu, lalu proses secara idempotent (callback bisa dikirim dobel).
import crypto from "node:crypto";
import { supabaseAdmin } from "./_lib/supabase.js";
import { notifyDiscord, orderFields, COLORS } from "./_lib/discord.js";
import { sendPaidEmail } from "./_lib/email.js";
import { deliverOrder } from "./_lib/delivery.js";

export const config = {
  api: { bodyParser: false }, // butuh raw body buat verifikasi signature
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ""));
  const y = Buffer.from(String(b ?? ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);
  const expected = crypto
    .createHmac("sha256", process.env.TRIPAY_PRIVATE_KEY)
    .update(rawBody)
    .digest("hex");

  if (!safeEqual(req.headers["x-callback-signature"], expected)) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }
  const { merchant_ref, status } = payload;
  if (!merchant_ref || !["PAID", "EXPIRED", "FAILED", "REFUND"].includes(status)) {
    return res.status(200).json({ success: true }); // event yang tidak kita pakai
  }

  try {
    if (status === "PAID") {
      // Transisi ke PAID hanya "menang" sekali → pengiriman tidak bisa dobel.
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .update({ status: "PAID", paid_at: new Date().toISOString() })
        .eq("merchant_ref", merchant_ref)
        .neq("status", "PAID")
        .select()
        .maybeSingle();
      if (error) throw error;

      if (order) {
        if (order.coupon_code) {
          const { error: rpcError } = await supabaseAdmin.rpc("redeem_coupon", { p_code: order.coupon_code });
          if (rpcError) console.error("redeem_coupon gagal:", rpcError.message);
        }
        // Semua jalan paralel supaya callback cepat selesai.
        await Promise.allSettled([
          notifyDiscord({ title: "💰 Pembayaran masuk", color: COLORS.success, fields: orderFields(order) }),
          sendPaidEmail(order),
          deliverOrder(merchant_ref, { from: ["PENDING"] }),
        ]);
      }
    } else if (status === "REFUND") {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .update({ status: "REFUND" })
        .eq("merchant_ref", merchant_ref)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (order) {
        await notifyDiscord({
          title: "↩️ Refund — cek manual (item mungkin sudah terkirim)",
          color: COLORS.warning,
          fields: orderFields(order),
        });
      }
    } else {
      // EXPIRED / FAILED: jangan menimpa order yang sudah PAID.
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ status })
        .eq("merchant_ref", merchant_ref)
        .eq("status", "UNPAID");
      if (error) throw error;
    }
  } catch (err) {
    console.error("tripay-callback error:", err);
    return res.status(500).json({ success: false }); // biar Tripay mencoba lagi
  }

  res.status(200).json({ success: true });
}
