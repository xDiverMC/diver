// src/pages/CekPesanan.jsx — cek riwayat order tanpa login (username MC atau email).
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import PixelBox from "../components/ui/PixelBox";
import PixelButton from "../components/ui/PixelButton";
import { useSeo } from "../hooks/useSeo";

const STATUS_LABEL = {
  PAID: "Dibayar",
  UNPAID: "Menunggu bayar",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
  REFUND: "Dikembalikan",
};
const STATUS_COLOR = {
  PAID: "text-emerald-400",
  UNPAID: "text-sky-400",
  EXPIRED: "text-red-400",
  FAILED: "text-red-400",
  REFUND: "text-amber-400",
};

function deliveryLabel(o) {
  if (o.status !== "PAID") return null;
  if (o.delivery_status === "DELIVERED") return "Item terkirim";
  if (o.delivery_status === "FAILED") return "Pengiriman bermasalah";
  if (o.delivery_status === "MANUAL") return "Dikirim manual oleh admin";
  return "Sedang dikirim";
}

export default function CekPesanan() {
  useSeo({ title: "Cek Pesanan", path: "/orders", noindex: true });
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOrders(null);
    setLoading(true);
    try {
      const res = await fetch("/api/my-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Gagal memuat pesanan.");
      else setOrders(data.orders);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }
    setLoading(false);
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="title gold-gradient-text">Cek Pesanan</h1>
      <p className="p">Masukkan username Minecraft atau email yang kamu pakai saat checkout.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          required
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Steve123 atau email@kamu.com"
          className="min-w-0 flex-1 rounded-sm bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-(--color-primary)"
        />
        <PixelButton type="submit" tone="primary" icon={loading ? Loader2 : Search} disabled={loading}>
          Cari
        </PixelButton>
      </form>

      {error && (
        <p className="mt-4 text-[12px] text-red-400 bg-red-950/40 border border-red-900 rounded-sm px-3 py-2">
          {error}
        </p>
      )}

      {orders && orders.length === 0 && (
        <p className="mt-8 text-center text-[12px] text-(--color-text-dim)">
          Tidak ada pesanan yang cocok.
        </p>
      )}

      {orders?.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {orders.map((o) => (
            <Link key={o.merchant_ref} to={`/order/${o.merchant_ref}`}>
              <PixelBox tone="neutral" contentClassName="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-(--color-text-muted)">{o.merchant_ref}</span>
                  <span className={STATUS_COLOR[o.status] ?? "text-white"}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
                <div className="text-[12.5px] text-white">
                  {o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                </div>
                <div className="flex items-center justify-between text-[11px] text-(--color-text-dim)">
                  <span>{new Date(o.created_at).toLocaleString("id-ID")}</span>
                  <span>Rp{Number(o.amount_idr).toLocaleString("id-ID")}</span>
                </div>
                {deliveryLabel(o) && (
                  <div className="text-[11px] text-emerald-300">{deliveryLabel(o)}</div>
                )}
              </PixelBox>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
