// api/_lib/delivery.js — auto-delivery item in-game lewat RCON (fitur 1).
//
// Setiap produk di store_content boleh punya:
//   commands:       ["lp user {player} parent set vip"]   // placeholder: {player} {qty} {ref}
//   repeat_per_qty: true  // jalankan commands sebanyak qty (dengan {qty}=1)
// Produk tanpa `commands` → order ditandai MANUAL (admin kirim manual, seperti sebelumnya).
import { supabaseAdmin } from "./supabase.js";
import { loadCatalog, findProduct } from "./pricing.js";
import { runRconCommands } from "./rcon.js";
import { notifyDiscord, orderFields, COLORS } from "./discord.js";
import { sendDeliveredEmail } from "./email.js";
import { logEvent } from "./logs.js";
import { MC_USERNAME_RE } from "./validate.js";

export const MAX_ATTEMPTS = Number(process.env.DELIVERY_MAX_ATTEMPTS) || 5;
const FAIL_RE = new RegExp(
  process.env.DELIVERY_FAIL_REGEX ||
    "no player was found|unknown or incomplete command|unknown command|player not found|not online|can't find player",
  "i"
);

const render = (tpl, vars) =>
  String(tpl).replace(/\{(player|qty|ref)\}/g, (_, k) => String(vars[k]));

const short = (s, n = 300) => String(s ?? "").slice(0, n);

/**
 * Kirim item satu order. Aman dipanggil berulang (callback Tripay bisa dobel):
 * hanya satu pemanggil yang berhasil "meng-claim" order lewat UPDATE bersyarat.
 *
 * @param {string} ref  merchant_ref
 * @param {{from?: string[]}} opts  status delivery yang boleh diproses
 */
export async function deliverOrder(ref, { from = ["PENDING"] } = {}) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("merchant_ref", ref)
    .maybeSingle();
  if (error || !order) return { ok: false, reason: "not_found" };
  if (order.status !== "PAID") return { ok: false, reason: "not_paid" };

  // Claim atomik: hanya lolos kalau status delivery masih di daftar `from`.
  const attempts = (order.delivery_attempts || 0) + 1;
  const { data: claimed } = await supabaseAdmin
    .from("orders")
    .update({
      delivery_status: "PROCESSING",
      delivery_attempts: attempts,
      delivery_started_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .in("delivery_status", from)
    .select()
    .maybeSingle();
  if (!claimed) return { ok: false, reason: "busy_or_done" };

  let finalStatus = "FAILED";
  let log = Array.isArray(claimed.delivery_log) ? [...claimed.delivery_log] : [];
  let errorText = "";

  try {
    const catalog = await loadCatalog();
    const player = claimed.customer_mc_username;
    const doneSkus = new Set(log.filter((e) => e.ok && e.sku).map((e) => e.sku));
    const manualLogged = new Set(log.filter((e) => e.manual).map((e) => e.sku));
    let failed = false;
    let manual = false;

    if (!MC_USERNAME_RE.test(player)) {
      manual = true;
      errorText = "Username Minecraft tidak valid untuk RCON";
    }

    for (const item of claimed.items ?? []) {
      if (doneSkus.has(item.sku)) continue;

      const product = findProduct(catalog, item.sku);
      const tpl = product?.commands;
      if (!MC_USERNAME_RE.test(player) || !Array.isArray(tpl) || tpl.length === 0) {
        manual = true;
        if (!manualLogged.has(item.sku)) {
          log.push({ ts: new Date().toISOString(), sku: item.sku, ok: false, manual: true, note: "Tidak ada commands — kirim manual" });
          manualLogged.add(item.sku);
        }
        continue;
      }

      const qty = Number(item.quantity) || 1;
      const times = product.repeat_per_qty ? qty : 1;
      const cmds = [];
      for (let i = 0; i < times; i++) {
        for (const t of tpl) {
          cmds.push(render(t, { player, qty: product.repeat_per_qty ? 1 : qty, ref: claimed.merchant_ref }));
        }
      }

      try {
        const results = await runRconCommands(cmds);
        const bad = results.find((r) => FAIL_RE.test(r.output));
        if (bad) {
          failed = true;
          errorText = `Server menolak: ${short(bad.output, 120)}`;
          log.push({ ts: new Date().toISOString(), sku: item.sku, ok: false, error: errorText, results: results.map((r) => ({ command: r.command, output: short(r.output) })) });
        } else {
          log.push({ ts: new Date().toISOString(), sku: item.sku, ok: true, results: results.map((r) => ({ command: r.command, output: short(r.output) })) });
        }
      } catch (err) {
        failed = true;
        errorText = err.message;
        log.push({ ts: new Date().toISOString(), sku: item.sku, ok: false, error: short(err.message) });
        break; // koneksi bermasalah → item lain pasti gagal juga
      }
    }

    finalStatus = failed ? "FAILED" : manual ? "MANUAL" : "DELIVERED";
  } catch (err) {
    console.error("deliverOrder error:", err);
    errorText = err.message;
    log.push({ ts: new Date().toISOString(), ok: false, error: short(err.message) });
    finalStatus = "FAILED";
  }

  log = log.slice(-50);
  const patch = {
    delivery_status: finalStatus,
    delivery_log: log,
    ...(finalStatus === "DELIVERED"
      ? { fulfilled: true, delivered_at: new Date().toISOString() }
      : {}),
  };
  await supabaseAdmin.from("orders").update(patch).eq("id", order.id);

  const updated = { ...claimed, ...patch };
  await logEvent(
    finalStatus === "DELIVERED" ? "info" : finalStatus === "FAILED" ? "error" : "warn",
    "delivery",
    `Pengiriman ${ref}: ${finalStatus}${errorText ? ` — ${errorText}` : ""}`,
    { attempts, player: claimed.customer_mc_username }
  );
  try {
    if (finalStatus === "DELIVERED") {
      await Promise.allSettled([
        notifyDiscord({ event: "delivered", title: "📦 Item terkirim otomatis", color: COLORS.success, fields: orderFields(updated) }),
        sendDeliveredEmail(updated),
      ]);
    } else if (finalStatus === "FAILED") {
      const giveUp = attempts >= MAX_ATTEMPTS;
      await notifyDiscord({
        event: "failed",
        title: giveUp ? "🚨 Pengiriman GAGAL — kirim manual!" : "⚠️ Pengiriman gagal (akan dicoba lagi)",
        description: `Percobaan ${attempts}/${MAX_ATTEMPTS}. ${errorText}`,
        color: COLORS.danger,
        fields: orderFields(updated),
      });
    } else if (finalStatus === "MANUAL") {
      await notifyDiscord({
        event: "manual",
        title: "🛠️ Perlu kirim manual",
        description: errorText || "Ada produk tanpa commands otomatis.",
        color: COLORS.warning,
        fields: orderFields(updated),
      });
    }
  } catch (err) {
    console.error("Notifikasi pengiriman gagal:", err);
  }

  return { ok: finalStatus === "DELIVERED", status: finalStatus, attempts };
}
