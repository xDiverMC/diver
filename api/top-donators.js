// api/top-donators.js — leaderboard donatur dari data order PAID (fitur 5).
import { supabaseAdmin } from "./_lib/supabase.js";
import { loadCatalog, parseUsd } from "./_lib/pricing.js";
import { startOfMonthUtc, sendError } from "./_lib/validate.js";
import { getSettings } from "./_lib/settings.js";

const PAGE = 1000;
const MAX_ROWS = 20000;

export default async function handler(req, res) {
  try {
    const period = req.query.period === "allTime" ? "allTime" : "monthly";
    const monthStart = startOfMonthUtc().toISOString();

    const hidden = new Set(((await getSettings()).leaderboard?.hidden ?? []).map((n) => String(n).toLowerCase()));

    const rows = [];
    for (let from = 0; from < MAX_ROWS; from += PAGE) {
      let q = supabaseAdmin
        .from("orders")
        .select("customer_mc_username, mc_username_lower, amount_idr, items, paid_at, created_at")
        .eq("status", "PAID")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (period === "monthly") {
        q = q.or(`paid_at.gte.${monthStart},and(paid_at.is.null,created_at.gte.${monthStart})`);
      }
      const { data, error } = await q;
      if (error) throw error;
      rows.push(...(data ?? []));
      if ((data ?? []).length < PAGE) break;
    }

    // Tier = rank termahal yang pernah dibeli player ini.
    const catalog = await loadCatalog();
    const rankPrice = new Map(
      catalog.filter((p) => p.category === "ranks").map((p) => [p.id, { name: p.name, price: parseUsd(p.price) }])
    );

    const byPlayer = new Map();
    for (const o of rows) {
      const k = o.mc_username_lower;
      if (hidden.has(k)) continue; // pemain yang meminta disembunyikan dari papan donatur
      const cur = byPlayer.get(k) ?? { username: o.customer_mc_username, amount: 0, tier: null, tierPrice: -1 };
      cur.amount += Number(o.amount_idr) || 0; // rows urut terbaru → username pertama = ejaan terbaru
      for (const it of o.items ?? []) {
        const r = rankPrice.get(it.sku) ?? rankPrice.get(`rank-${it.sku}`);
        if (r && r.price > cur.tierPrice) {
          cur.tier = r.name;
          cur.tierPrice = r.price;
        }
      }
      byPlayer.set(k, cur);
    }

    const donators = [...byPlayer.values()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)
      .map((d, i) => ({ rank: i + 1, username: d.username, amount: d.amount, tier: d.tier ?? "SUPPORTER" }));

    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.status(200).json({ period, donators });
  } catch (err) {
    sendError(res, err);
  }
}
