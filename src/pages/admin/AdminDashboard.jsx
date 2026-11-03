// src/pages/admin/AdminDashboard.jsx — ringkasan penjualan + grafik.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TriangleAlert, PackageCheck, RefreshCw, TrendingUp, Wallet, Receipt, Percent } from "lucide-react";
import { adminFetch } from "../../lib/adminApi";
import { Card, PageHeader, Button, StatCard, Segmented, Spinner, Badge, EmptyState } from "../../components/admin/ui";
import { AreaChart, BarList, Donut } from "../../components/admin/charts";
import { buildStats, formatIDR, STATUS_META } from "../../lib/adminStats";

const RANGES = [
  { value: 7, label: "7 hari" },
  { value: 30, label: "30 hari" },
  { value: 90, label: "90 hari" },
];
const STATUS_TONE = { PAID: "success", UNPAID: "info", EXPIRED: "neutral", FAILED: "danger", REFUND: "warning" };

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [needsAction, setNeedsAction] = useState(0);
  const [catalogMissing, setCatalogMissing] = useState(false);
  const [schemaOutdated, setSchemaOutdated] = useState(false);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const d = await adminFetch("dashboard");
      setOrders(d.orders ?? []);
      setNeedsAction(d.todo ?? 0);
      setCatalogMissing(Boolean(d.catalogMissing));
      setSchemaOutdated(Boolean(d.schemaOutdated));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => buildStats(orders, { days: range }), [orders, range]);
  const recent = orders.slice(0, 6);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Ringkasan penjualan toko."
        action={
          <div className="flex items-center gap-2">
            <Segmented options={RANGES} value={range} onChange={setRange} />
            <Button variant="secondary" onClick={load} aria-label="Muat ulang">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        }
      />

      {schemaOutdated && (
        <Link to="/admin/settings" className="block">
          <div className="flex items-start gap-3 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <span>
              <b>Database belum diperbarui.</b> Pesanan baru tidak bisa tersimpan sampai file <code>supabase/setup.sql</code>{" "}
              dijalankan di Supabase SQL Editor. Buka <u>Pengaturan → Cek sistem</u> untuk detailnya.
            </span>
          </div>
        </Link>
      )}

      {catalogMissing && (
        <Link to="/admin/store" className="block">
          <div className="flex items-start gap-3 rounded-xl border border-amber-900 bg-amber-950/40 p-4 text-sm text-amber-200">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <span>
              <b>Katalog produk belum disimpan ke database.</b> Toko menampilkan data bawaan, tapi checkout hanya bisa
              memproses produk yang tersimpan. Buka <u>Produk</u> lalu klik <b>Simpan</b> di tiap tab.
            </span>
          </div>
        </Link>
      )}

      {needsAction > 0 && (
        <Link to="/admin/orders?tab=todo" className="block">
          <div className="flex items-center gap-3 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            <PackageCheck size={18} className="shrink-0" />
            <span className="flex-1">
              <b>{needsAction} pesanan</b> sudah dibayar tapi belum terkirim.
            </span>
            <span className="underline">Tangani →</span>
          </div>
        </Link>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</p>
      )}

      {loading && orders.length === 0 ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={`Pendapatan ${range} hari`}
              value={formatIDR(stats.revenue)}
              delta={stats.deltaPct}
              hint="vs periode lalu"
              icon={Wallet}
              tone="success"
            />
            <StatCard
              label="Hari ini"
              value={formatIDR(stats.today)}
              hint={`${stats.todayOrders} order`}
              icon={TrendingUp}
              tone="info"
            />
            <StatCard
              label="Order dibayar"
              value={stats.paid}
              hint={`rata-rata ${formatIDR(stats.avgOrder)}`}
              icon={Receipt}
              tone="neutral"
            />
            <StatCard
              label="Konversi"
              value={stats.conversionPct == null ? "–" : `${stats.conversionPct}%`}
              hint="order yang dibayar"
              icon={Percent}
              tone="warning"
            />
          </div>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Pendapatan harian</h2>
            {stats.revenue === 0 ? (
              <EmptyState title="Belum ada penjualan" description={`Tidak ada pembayaran dalam ${range} hari terakhir.`} />
            ) : (
              <AreaChart data={stats.days} />
            )}
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Produk terlaris</h2>
              {stats.topProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-500">Belum ada data.</p>
              ) : (
                <BarList items={stats.topProducts} />
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Status pesanan</h2>
              {stats.statusBreakdown.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-500">Belum ada data.</p>
              ) : (
                <Donut segments={stats.statusBreakdown} />
              )}
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-sm font-semibold text-white">Pesanan terbaru</h2>
              <Link to="/admin/orders" className="text-xs text-emerald-400 hover:underline">
                Lihat semua
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-neutral-500">Belum ada pesanan.</p>
            ) : (
              <div className="divide-y divide-neutral-800">
                {recent.map((o) => (
                  <div key={o.merchant_ref} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate text-white">{o.customer_mc_username}</div>
                      <div className="truncate text-xs text-neutral-500">
                        {(o.items ?? []).map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-neutral-200">{formatIDR(o.amount_idr)}</div>
                      <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{STATUS_META[o.status]?.label ?? o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
