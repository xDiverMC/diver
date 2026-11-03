// api/_lib/email.js — email transaksional lewat Resend (fitur 3). Gagal = diabaikan.
import { formatIDR } from "./validate.js";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM; // contoh: "SiestaNet <noreply@domainmu.com>"
  if (!key || !from || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("Resend gagal:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("Email gagal:", err.message);
    return false;
  }
}

function layout(title, body, order) {
  const site = process.env.PUBLIC_SITE_URL || "";
  const link = `${site}/order/${encodeURIComponent(order.merchant_ref)}`;
  const rows = (order.items ?? [])
    .map((i) => `<li>${esc(i.name)} × ${esc(i.quantity)}</li>`)
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:20px;color:#111">
    <h2 style="margin:0 0 12px">${esc(title)}</h2>
    <p>Halo ${esc(order.customer_name)},</p>
    ${body}
    <ul>${rows}</ul>
    <p>Total: <b>${formatIDR(order.amount_idr)}</b><br>Akun Minecraft: <b>${esc(order.customer_mc_username)}</b><br>Ref: ${esc(order.merchant_ref)}</p>
    <p><a href="${esc(link)}" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Lihat status pesanan</a></p>
  </div>`;
}

export const sendPaidEmail = (order) =>
  sendEmail({
    to: order.customer_email,
    subject: `Pembayaran diterima — ${order.merchant_ref}`,
    html: layout("Pembayaran diterima ✅", "<p>Terima kasih! Pembayaranmu sudah kami terima. Item sedang diproses:</p>", order),
  });

export const sendDeliveredEmail = (order) =>
  sendEmail({
    to: order.customer_email,
    subject: `Item sudah dikirim — ${order.merchant_ref}`,
    html: layout("Item sudah dikirim 🎉", "<p>Pesananmu sudah dikirim ke akun Minecraft kamu. Selamat bermain!</p>", order),
  });
