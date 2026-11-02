// src/lib/adminStats.js — hitung statistik dashboard dari daftar order (fungsi murni, tanpa React).
export const TZ_OFFSET_HOURS = 8; // WITA — samakan dengan TZ_OFFSET_HOURS di server
const DAY_MS = 86400e3;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const STATUS_META = {
  PAID: { label: "Dibayar", color: "#10b981" },
  UNPAID: { label: "Belum bayar", color: "#38bdf8" },
  EXPIRED: { label: "Kedaluwarsa", color: "#737373" },
  FAILED: { label: "Gagal", color: "#ef4444" },
  REFUND: { label: "Refund", color: "#f59e0b" },
};

export function dayKey(date) {
  return new Date(new Date(date).getTime() + TZ_OFFSET_HOURS * 3600e3).toISOString().slice(0, 10);
}

export function dayLabel(key) {
  const [, m, d] = key.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

export const paidAt = (o) => o.paid_at ?? o.created_at;

export function formatIDR(n) {
  return "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");
}

// 1.250.000 → "Rp1,3jt", 450.000 → "Rp450rb"
export function compactIDR(n) {
  const v = Math.round(Number(n) || 0);
  if (v >= 1e9) return "Rp" + trim(v / 1e9) + "M";
  if (v >= 1e6) return "Rp" + trim(v / 1e6) + "jt";
  if (v >= 1e3) return "Rp" + Math.round(v / 1e3) + "rb";
  return "Rp" + v;
}
const trim = (x) => String(Math.round(x * 10) / 10).replace(".", ",");

// Batas atas sumbu Y yang "bulat": 0→1, 730→1000, 3200→5000.
export function niceMax(max) {
  if (!(max > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/**
 * @param orders  baris tabel orders
 * @param opts.days jumlah hari terakhir (termasuk hari ini)
 */
export function buildStats(orders, { now = new Date(), days = 30 } = {}) {
  const keys = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(new Date(now.getTime() - i * DAY_MS)));
  const prevKeys = new Set();
  for (let i = 2 * days - 1; i >= days; i--) prevKeys.add(dayKey(new Date(now.getTime() - i * DAY_MS)));

  const daily = new Map(keys.map((k) => [k, { key: k, label: dayLabel(k), revenue: 0, orders: 0 }]));
  const todayKey = keys[keys.length - 1];

  let revenue = 0;
  let paid = 0;
  let prevRevenue = 0;
  let today = 0;
  let todayOrders = 0;
  const statusCount = {};
  const products = new Map();

  for (const o of orders) {
    if (daily.has(dayKey(o.created_at))) {
      statusCount[o.status] = (statusCount[o.status] ?? 0) + 1;
    }
    if (o.status !== "PAID") continue;

    const k = dayKey(paidAt(o));
    const amount = Number(o.amount_idr) || 0;

    if (prevKeys.has(k)) prevRevenue += amount;

    const bucket = daily.get(k);
    if (!bucket) continue;
    bucket.revenue += amount;
    bucket.orders += 1;
    revenue += amount;
    paid += 1;
    if (k === todayKey) {
      today += amount;
      todayOrders += 1;
    }

    for (const it of o.items ?? []) {
      const qty = Number(it.quantity) || 1;
      const cur = products.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
      cur.qty += qty;
      cur.revenue += (Number(it.price) || 0) * qty;
      products.set(it.name, cur);
    }
  }

  const totalCreated = Object.values(statusCount).reduce((a, b) => a + b, 0);

  return {
    days: [...daily.values()],
    revenue,
    paid,
    avgOrder: paid ? Math.round(revenue / paid) : 0,
    today,
    todayOrders,
    deltaPct: prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null,
    conversionPct: totalCreated ? Math.round((paid / totalCreated) * 100) : null,
    statusBreakdown: Object.entries(STATUS_META)
      .map(([key, m]) => ({ key, label: m.label, color: m.color, value: statusCount[key] ?? 0 }))
      .filter((s) => s.value > 0),
    topProducts: [...products.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 6),
  };
}
