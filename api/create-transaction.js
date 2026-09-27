// api/create-transaction.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Service role key bypasses RLS — server-side ONLY, never expose to the
// browser. Set as an environment variable in Vercel.
const supabaseAdmin = createClient(
  "https://wyvninaekoahdwichgmw.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Kurs tetap buat konversi harga USD (yang tampil di web) ke IDR (yang
// dipakai Tripay). Ubah angka ini kalau kurs berubah jauh.
const USD_TO_IDR = 16000;

async function getCategoryPrices(key) {
  const { data } = await supabaseAdmin
    .from("store_content")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  return data?.data ?? [];
}

function parseUsd(priceStr) {
  return Number(String(priceStr).replace(/[^0-9.]/g, "")) || 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, customer_name, customer_email, customer_mc_username, method } =
      req.body;

    if (!items?.length) return res.status(400).json({ error: "Cart is empty" });
    if (!customer_mc_username)
      return res.status(400).json({ error: "Minecraft username wajib diisi" });

    // Re-hitung harga dari database (JANGAN percaya harga dari client).
    const [ranks, crateKeys, currencyPacks] = await Promise.all([
      getCategoryPrices("ranks"),
      getCategoryPrices("crate_keys"),
      getCategoryPrices("currency_packs"),
    ]);
    const catalog = [...ranks, ...crateKeys, ...currencyPacks];

    let amountUsd = 0;
    const orderItems = [];
    for (const cartItem of items) {
      const product = catalog.find((p) => p.key === cartItem.id);
      if (!product) continue;
      const price = parseUsd(product.price);
      const qty = Math.max(1, Number(cartItem.qty) || 1);
      amountUsd += price * qty;
      orderItems.push({
        sku: product.key,
        name: product.name,
        price: Math.round(price * USD_TO_IDR),
        quantity: qty,
      });
    }

    if (amountUsd <= 0) {
      return res.status(400).json({ error: "Invalid cart" });
    }

    const amountIdr = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const merchantRef = `BDZ-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const merchantCode = process.env.TRIPAY_MERCHANT_CODE;
    const privateKey = process.env.TRIPAY_PRIVATE_KEY;
    const signature = crypto
      .createHmac("sha256", privateKey)
      .update(merchantCode + merchantRef + amountIdr)
      .digest("hex");

    const tripayRes = await fetch(
      "https://tripay.co.id/api/transaction/create",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TRIPAY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
          merchant_ref: merchantRef,
          amount: amountIdr,
          customer_name,
          customer_email,
          order_items: orderItems,
          callback_url: `${process.env.PUBLIC_SITE_URL}/api/tripay-callback`,
          return_url: `${process.env.PUBLIC_SITE_URL}/order/${merchantRef}`,
          expired_time: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
          signature,
        }),
      }
    );
    const tripayJson = await tripayRes.json();

    if (!tripayJson.success) {
      return res
        .status(400)
        .json({ error: tripayJson.message || "Tripay menolak transaksi" });
    }

    await supabaseAdmin.from("orders").insert({
      merchant_ref: merchantRef,
      tripay_reference: tripayJson.data.reference,
      status: "UNPAID",
      customer_name,
      customer_email,
      customer_mc_username,
      items: orderItems,
      amount_idr: amountIdr,
      payment_method: method,
      checkout_url: tripayJson.data.checkout_url,
    });

    res.status(200).json({ checkout_url: tripayJson.data.checkout_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
