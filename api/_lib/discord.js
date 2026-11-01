// api/_lib/discord.js — notifikasi Discord webhook (fitur 2). Gagal = diabaikan.
import { formatIDR } from "./validate.js";

export const COLORS = {
  info: 0x3b82f6,
  success: 0x22c55e,
  warning: 0xf59e0b,
  danger: 0xef4444,
};

export async function notifyDiscord({ title, description, color = COLORS.info, fields = [] }) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "BDZONE Store",
        allowed_mentions: { parse: [] }, // jangan pernah ping siapa pun
        embeds: [
          {
            title: String(title).slice(0, 250),
            description: description ? String(description).slice(0, 1800) : undefined,
            color,
            fields: fields.slice(0, 20).map((f) => ({
              name: String(f.name).slice(0, 250),
              value: String(f.value || "-").slice(0, 1000),
              inline: !!f.inline,
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch (err) {
    console.error("Discord webhook gagal:", err.message);
    return false;
  }
}

export function orderFields(order) {
  const items = (order.items ?? []).map((i) => `• ${i.name} × ${i.quantity}`).join("\n");
  return [
    { name: "Player", value: order.customer_mc_username, inline: true },
    { name: "Total", value: formatIDR(order.amount_idr), inline: true },
    { name: "Ref", value: order.merchant_ref, inline: false },
    { name: "Item", value: items || "-" },
    ...(order.coupon_code
      ? [{ name: "Kupon", value: `${order.coupon_code} (-${formatIDR(order.discount_idr)})`, inline: true }]
      : []),
  ];
}
