// src/pages/admin/AdminOrders.jsx — daftar pesanan, versi ringkas.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, PackageCheck, RefreshCw, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Button, EmptyState, Spinner, Badge, Segmented } from "../../components/admin/ui";
import { formatIDR, STATUS_META } from "../../lib/adminStats";

const STATUS_TONE = { PAID: "success", UNPAID: "info", EXPIRED: "neutral", FAILED: "danger", REFUND: "warning" };

const DELIVERY = {
  DELIVERED: { tone: "success", label: "Terkirim" },
  PROCESSING: { tone: "info", label: "Mengirim..." },
  PENDING: { tone: "info", label: "Antre kirim" },
  FAILED: { tone: "danger", label: "Gagal kirim" },
  MANUAL: { tone: "warning", label: "Kirim manual" },
};

const PAGE_SIZE = 30;
const needsAction = (o) => o.status === "PAID" && !o.fulfilled;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") === "todo" ? "todo" : "all");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [busyRef, setBusyRef] = useState("");
  const [notice, setNotice] = useState("");

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (err) {
      setError(err.message);
    } else {
      setOrders(data ?? []);
      setError("");
    }
    if (!silent) setLoading(false);
  }

  // Muat saat dibuka + segarkan otomatis tiap 30 detik.
  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, []);

  async function markFulfilled(id) {
    await supabase
      .from("orders")
      .update({ fulfilled: true, delivery_status: "DELIVERED", delivered_at: new Date().toISOString() })
      .eq("id", id);
    load();
  }

  async function retryDelivery(ref) {
    setBusyRef(ref);
    setNotice("");
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/admin-retry-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token ?? ""}` },
        body: JSON.stringify({ ref }),
      });
      const data = await res.json();
      if (!res.ok) setNotice(data.error || "Gagal mengirim ulang.");
      else if (data.status === "DELIVERED") setNotice(`${ref}: berhasil dikirim ✅`);
      else setNotice(`${ref}: ${data.status ?? data.reason} — lihat log di kartu pesanan.`);
    } catch {
      setNotice("Gagal menghubungi server.");
    }
    setBusyRef("");
    load();
  }

  const todoCount = useMemo(() => orders.filter(needsAction).length, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab === "todo" && !needsAction(o)) return false;
      if (tab === "unpaid" && o.status !== "UNPAID") return false;
      if (!q) return true;
      return [o.customer_mc_username, o.merchant_ref, o.customer_email, o.customer_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orders, tab, search]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pesanan"
        description="Item dikirim otomatis setelah bayar. Yang gagal atau perlu manual ada di 'Perlu ditangani'."
        action={
          <Button variant="secondary" onClick={load} aria-label="Muat ulang">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={tab}
          onChange={(v) => {
            setTab(v);
            setLimit(PAGE_SIZE);
          }}
          options={[
            { value: "all", label: `Semua (${orders.length})` },
            { value: "todo", label: todoCount ? `Perlu ditangani (${todoCount})` : "Perlu ditangani" },
            { value: "unpaid", label: "Belum bayar" },
          ]}
        />
        <div className="relative min-w-48 flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Cari pesanan…"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {notice && (
        <p className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200">{notice}</p>
      )}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <b>Pesanan gagal dimuat:</b> {error}
          <div className="mt-1 text-xs text-red-300/80">
            Kalau pesannya soal izin (permission/RLS), tambahkan policy SELECT untuk role <code>authenticated</code> di
            tabel <code>orders</code>. Kalau soal kolom, jalankan <code>supabase/001_features.sql</code>.
          </div>
        </div>
      )}

      {loading && orders.length === 0 && <Spinner />}

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          icon={PackageCheck}
          title={
            search
              ? "Tidak ditemukan"
              : tab === "todo"
                ? "Semua pesanan beres 🎉"
                : tab === "unpaid"
                  ? "Tidak ada yang menunggu pembayaran"
                  : "Belum ada pesanan"
          }
          description={
            search
              ? "Coba kata kunci lain."
              : "Pesanan muncul di sini begitu pembeli menekan “Lanjut ke Pembayaran” di checkout, bahkan sebelum dibayar."
          }
        />
      )}

      {visible.length > 0 && (
        <div className="space-y-3">
          {visible.slice(0, limit).map((o) => {
            const dm = DELIVERY[o.delivery_status];
            const log = Array.isArray(o.delivery_log) ? o.delivery_log : [];
            const busy = busyRef === o.merchant_ref;
            return (
              <Card key={o.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{o.customer_mc_username}</span>
                      <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{STATUS_META[o.status]?.label ?? o.status}</Badge>
                      {o.status === "PAID" && dm && <Badge tone={dm.tone}>{o.fulfilled ? "Terkirim" : dm.label}</Badge>}
                      {o.coupon_code && <Badge tone="info">{o.coupon_code}</Badge>}
                    </div>
                    <div className="mt-1.5 text-sm text-neutral-300">
                      {(o.items ?? []).map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {new Date(o.created_at).toLocaleString("id-ID")} · {o.customer_email} · {o.merchant_ref}
                    </div>

                    {log.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-300">
                          Log pengiriman ({log.length})
                        </summary>
                        <div className="mt-1.5 space-y-1 font-mono text-[11px]">
                          {log.map((e, i) => (
                            <div key={i} className={e.ok ? "text-emerald-400" : e.manual ? "text-amber-400" : "text-red-400"}>
                              {new Date(e.ts).toLocaleTimeString("id-ID")} · {e.sku ?? "-"} ·{" "}
                              {e.ok ? "OK" : e.error || e.note || "gagal"}
                              {(e.results ?? []).map((r, j) => (
                                <div key={j} className="pl-3 text-neutral-500">
                                  &gt; {r.command}
                                  {r.output ? ` → ${r.output}` : ""}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="font-semibold text-white">{formatIDR(o.amount_idr)}</div>
                    {o.discount_idr > 0 && (
                      <div className="text-[11px] text-emerald-400">hemat {formatIDR(o.discount_idr)}</div>
                    )}
                  </div>
                </div>

                {needsAction(o) && (
                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-neutral-800 pt-3">
                    {o.delivery_status !== "PROCESSING" && (
                      <Button variant="secondary" disabled={busy} onClick={() => retryDelivery(o.merchant_ref)}>
                        <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Kirim ulang
                      </Button>
                    )}
                    <Button onClick={() => markFulfilled(o.id)}>
                      <CheckCircle2 size={14} /> Tandai terkirim
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}

          {visible.length > limit && (
            <div className="text-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                Tampilkan lebih banyak ({visible.length - limit})
              </Button>
            </div>
          )}
        </div>
      )}
    
      <details className="rounded-xl border border-white/[0.07] bg-neutral-900/40 px-4 py-3 text-sm text-neutral-400">
        <summary className="cursor-pointer text-neutral-300">Bagaimana alur pesanan?</summary>
        <ol className="mt-3 list-inside list-decimal space-y-1.5 text-neutral-400">
          <li><b className="text-neutral-200">Belum bayar</b> — pembeli menekan “Lanjut ke Pembayaran”. Pesanan langsung tercatat di sini.</li>
          <li><b className="text-neutral-200">Dibayar</b> — Tripay mengabari server. Status berubah otomatis dan notif masuk ke Discord.</li>
          <li><b className="text-neutral-200">Mengirim</b> — server menjalankan command RCON ke akun Minecraft pembeli.</li>
          <li><b className="text-neutral-200">Terkirim</b> — selesai. Pembeli dapat email, dan status di halaman pesanannya ikut berubah.</li>
          <li><b className="text-neutral-200">Gagal kirim / Kirim manual</b> — muncul di “Perlu ditangani”. Cek log, lalu “Kirim ulang” atau “Tandai terkirim”.</li>
          <li><b className="text-neutral-200">Kedaluwarsa</b> — tidak dibayar dalam 24 jam, dibersihkan otomatis.</li>
        </ol>
      </details>
    </div>
  );
}
