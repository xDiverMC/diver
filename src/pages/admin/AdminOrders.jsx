// src/pages/admin/AdminOrders.jsx — daftar pesanan, versi ringkas.
import { useEffect, useMemo, useState } from "react";
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
  const [tab, setTab] = useState("todo");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [busyRef, setBusyRef] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setOrders(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
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
            { value: "todo", label: `Perlu ditangani (${todoCount})` },
            { value: "all", label: "Semua" },
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
            placeholder="Cari username, email, atau ref…"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {notice && (
        <p className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200">{notice}</p>
      )}

      {loading && orders.length === 0 && <Spinner />}

      {!loading && visible.length === 0 && (
        <EmptyState
          icon={PackageCheck}
          title={tab === "todo" && !search ? "Semua pesanan beres 🎉" : "Tidak ada pesanan"}
          description={search ? "Coba kata kunci lain." : "Pesanan dari checkout akan muncul di sini."}
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
    </div>
  );
}
