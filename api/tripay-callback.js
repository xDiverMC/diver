// api/tripay-callback.js
// Tripay "mengetuk" endpoint ini tiap status pembayaran berubah.
// Verifikasi signature-nya dulu sebelum percaya datanya.
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://wyvninaekoahdwichgmw.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);
  const callbackSignature = req.headers["x-callback-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", process.env.TRIPAY_PRIVATE_KEY)
    .update(rawBody)
    .digest("hex");

  if (callbackSignature !== expectedSignature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const payload = JSON.parse(rawBody);
  const { merchant_ref, status } = payload;

  await supabaseAdmin
    .from("orders")
    .update({ status }) // PAID | EXPIRED | FAILED | REFUND
    .eq("merchant_ref", merchant_ref);

  res.status(200).json({ success: true });
}
