// api/store-stats.js — angka "Total raised / donators / target bulanan" dari pesanan PAID asli.
// Publik (tanpa login), hanya mengembalikan angka agregat.
import { supabaseAdmin } from "./_lib/supabase.js";
import { getSettings } from "./_lib/settings.js";
import { startOfMonthUtc, TZ_OFFSET_HOURS, sendError } from "./_lib/validate.js";

const PAGE = 1000;
const MAX_ROWS = 20000;

function startOfNextMonthUtc(now = new Date()) {
  const s = new Date(startOfMonthUtc(now).getTime() + TZ_OFFSET_HOURS * 3600e3);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 1) - TZ_OFFSET_HOURS * 3600e3);
}

export default async function handler(req, res) {
  try {
    const monthStart = startOfMonthUtc().getTime();

    const rows = [];
    for (let from = 0; from < MAX_ROWS; from += PAGE) {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("mc_username_lower, amount_idr, paid_at, created_at")
        .eq("status", "PAID")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      rows.push(...(data ?? []));
      if ((data ?? []).length < PAGE) break;
    }

    let totalRaised = 0;
    let monthRaised = 0;
    const allPlayers = new Set();
    const monthPlayers = new Set();
    for (const o of rows) {
      const amount = Number(o.amount_idr) || 0;
      totalRaised += amount;
      allPlayers.add(o.mc_username_lower);
      if (new Date(o.paid_at ?? o.created_at).getTime() >= monthStart) {
        monthRaised += amount;
        monthPlayers.add(o.mc_username_lower);
      }
    }

    const target = Math.max(0, Math.floor(Number((await getSettings()).goal?.monthly_target_idr) || 0));

    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.status(200).json({
      totalRaised,
      totalDonators: allPlayers.size,
      month: {
        current: monthRaised,
        supporters: monthPlayers.size,
        target, // 0 = target belum diatur → blok target disembunyikan di website
        endsAt: startOfNextMonthUtc().toISOString(),
      },
    });
  } catch (err) {
    sendError(res, err);
  }
}
