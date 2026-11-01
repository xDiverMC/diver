// src/pages/admin/AdminOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PackageCheck, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Button, EmptyState, Spinner, Badge } from "../../components/admin/ui";

const STATUS_TONE = {
  PAID: "success",
  UNPAID: "info",
  EXPIRED: "neutral",
  FAILED: "danger",
  REFUND: "danger",
};

const DELIVERY_META = {
  DELIVERED: { tone: "success", label: "Terkirim otomatis" },
  PROCESSING: { tone: "info", label: "Sedang dikirim" },
  PENDING: { tone: "info", label: "Menunggu pengiriman" },
  FAILED: { tone: "danger", label: "Pengiriman GAGAL" },
  MANUAL: { tone: "danger", label: "Perlu kirim manual" },
};

const FILTERS = [
  { key: "TODO", label: "Perlu ditangani" },
  { key: "PAID", label: "Dibayar" },
  { key: "UNPAID", label: "Belum bayar" },
  { key: "EXPIRED", label: "Expired" },
  { key: "ALL", label: "Semua" },
];

function formatIDR(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

// Order PAID yang belum selesai dikirim = antrean admin.
const needsAction = (o) => o.status === "PAID" && !o.fulfilled;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TODO");
  const [busyRef, setBusyRef] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setOrders(data);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ ref }),
      });
      const data = await res.json();
      if (!res.ok) setNotice(data.error || "Gagal mengirim ulang.");
      else if (data.status === "DELIVERED") setNotice(`${ref}: berhasil dikirim ✅`);
      else setNotice(`${ref}: hasil ${data.status ?? data.reason} — cek log di bawah.`);
    } catch {
      setNotice("Gagal menghubungi server.");
    }
    setBusyRef("");
    load();
  }

  const counts = useMemo(
    () => ({
      TODO: orders.filter(needsAction).length,
      PAID: orders.filter((o) => o.status === "PAID").length,
      UNPAID: orders.filter((o) => o.status === "UNPAID").length,
      EXPIRED: orders.filter((o) => o.status === "EXPIRED").length,
      ALL: orders.length,
    }),
    [orders]
  );

  const visible = orders.filter((o) => {
    if (filter === "ALL") return true;
    if (filter === "TODO") return needsAction(o);
    return o.status === filter;
  });

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Pesanan dibayar dikirim otomatis lewat RCON. Yang gagal / perlu manual muncul di 'Perlu ditangani'."
        action={
          <Button variant="secondary" onClick={load}>
            <RefreshCw size={14} /> Muat ulang
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              filter === f.key
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {notice && (
        <p className="text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 mb-4">
          {notice}
        </p>
      )}

      {loading && <Spinner />}

      {!loading && visible.length === 0 && (
        <EmptyState
          icon={PackageCheck}
          title={filter === "TODO" ? "Semua pesanan beres 🎉" : "Belum ada pesanan"}
          description="Pesanan dari checkout akan muncul di sini."
        />
      )}

      {!loading && visible.length > 0 && (
        <Card className="divide-y divide-neutral-800">
          {visible.map((o) => {
            const dm = DELIVERY_META[o.delivery_status];
            const log = Array.isArray(o.delivery_log) ? o.delivery_log : [];
            return (
              <div key={o.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{o.customer_mc_username}</span>
                      <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
                      {o.status === "PAID" && dm && (
                        <Badge tone={dm.tone}>{o.fulfilled && o.delivery_status !== "DELIVERED" ? "Sudah dikirim" : dm.label}</Badge>
                      )}
                      {o.coupon_code && <Badge tone="info">Kupon {o.coupon_code}</Badge>}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {o.customer_name} · {o.customer_email} · {o.merchant_ref}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(o.created_at).toLocaleString("id-ID")}
                      {o.delivery_attempts > 0 && ` · percobaan kirim: ${o.delivery_attempts}`}
                    </div>
                    <div className="text-xs text-neutral-400 mt-2 space-y-0.5">
                      {(o.items ?? []).map((it, i) => (
                        <div key={i}>
                          {it.name} × {it.quantity}
                        </div>
                      ))}
                    </div>

                    {log.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300">
                          Log pengiriman ({log.length})
                        </summary>
                        <div className="mt-1 space-y-1 text-[11px] font-mono text-neutral-400">
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

                  <div className="text-right shrink-0">
                    <div className="text-white font-medium">{formatIDR(o.amount_idr)}</div>
                    {o.discount_idr > 0 && (
                      <div className="text-[11px] text-emerald-400">diskon {formatIDR(o.discount_idr)}</div>
                    )}
                    {needsAction(o) && (
                      <div className="mt-2 flex flex-col gap-1.5 items-end">
                        {o.delivery_status !== "PROCESSING" && (
                          <Button
                            variant="secondary"
                            disabled={busyRef === o.merchant_ref}
                            onClick={() => retryDelivery(o.merchant_ref)}
                          >
                            <RefreshCw size={14} className={busyRef === o.merchant_ref ? "animate-spin" : ""} />
                            Kirim ulang
                          </Button>
                        )}
                        <Button onClick={() => markFulfilled(o.id)}>
                          <CheckCircle2 size={14} /> Tandai Terkirim
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
