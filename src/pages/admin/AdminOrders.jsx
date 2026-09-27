// src/pages/admin/AdminOrders.jsx
import { useEffect, useState } from "react";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Button, EmptyState, Spinner, Badge } from "../../components/admin/ui";

const STATUS_TONE = {
  PAID: "success",
  UNPAID: "info",
  EXPIRED: "danger",
  FAILED: "danger",
};

function formatIDR(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PAID"); // default: yang butuh dikirim

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markFulfilled(id) {
    await supabase.from("orders").update({ fulfilled: true }).eq("id", id);
    load();
  }

  const visible = orders.filter((o) => (filter === "ALL" ? true : o.status === filter));

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Pesanan dari pembeli — cek yang PAID, kirim item in-game, lalu tandai selesai."
      />

      <div className="flex gap-2 mb-4">
        {["PAID", "UNPAID", "ALL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              filter === f
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && visible.length === 0 && (
        <EmptyState
          icon={PackageCheck}
          title="Belum ada pesanan"
          description="Pesanan dari checkout akan muncul di sini."
        />
      )}

      {!loading && visible.length > 0 && (
        <Card className="divide-y divide-neutral-800">
          {visible.map((o) => (
            <div key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{o.customer_mc_username}</span>
                    <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
                    {o.status === "PAID" && (
                      <Badge tone={o.fulfilled ? "success" : "danger"}>
                        {o.fulfilled ? "Sudah dikirim" : "Belum dikirim"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {o.customer_name} · {o.customer_email} · {o.merchant_ref}
                  </div>
                  <div className="text-xs text-neutral-400 mt-2 space-y-0.5">
                    {(o.items ?? []).map((it, i) => (
                      <div key={i}>
                        {it.name} × {it.quantity}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-white font-medium">{formatIDR(o.amount_idr)}</div>
                  {o.status === "PAID" && !o.fulfilled && (
                    <Button
                      className="mt-2"
                      onClick={() => markFulfilled(o.id)}
                    >
                      <CheckCircle2 size={14} /> Tandai Terkirim
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
