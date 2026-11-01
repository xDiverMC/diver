// src/pages/OrderStatus.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, PartyPopper, Loader2 } from "lucide-react";
import PixelBox from "../components/ui/PixelBox";
import PixelButton from "../components/ui/PixelButton";
import { useSeo } from "../hooks/useSeo";

const STATUS_META = {
  PAID: { icon: PartyPopper, tone: "success", label: "Pembayaran Berhasil!" },
  UNPAID: { icon: Clock, tone: "info", label: "Menunggu Pembayaran" },
  EXPIRED: { icon: XCircle, tone: "danger", label: "Pesanan Kedaluwarsa" },
  FAILED: { icon: XCircle, tone: "danger", label: "Pembayaran Gagal" },
  REFUND: { icon: XCircle, tone: "danger", label: "Pembayaran Dikembalikan" },
};

const POLL_MS = 5000;
const MAX_POLLS = 120; // ±10 menit, lalu berhenti

// Apakah halaman perlu terus dicek ulang?
function isPending(o) {
  if (!o || o.error) return false;
  if (o.status === "UNPAID") return true;
  return o.status === "PAID" && ["PENDING", "PROCESSING"].includes(o.delivery_status);
}

function DeliveryNote({ order }) {
  const player = <b>{order.customer_mc_username}</b>;
  const cls = "max-w-xs text-[12px] leading-relaxed text-white/80";

  if (order.fulfilled || order.delivery_status === "DELIVERED") {
    return <p className={cls}>Item sudah dikirim ke akun {player}. Selamat bermain! 🎉</p>;
  }
  if (["PENDING", "PROCESSING"].includes(order.delivery_status)) {
    return (
      <p className={cls}>
        <Loader2 size={12} className="mr-1 inline animate-spin" />
        Item sedang dikirim ke akun {player}. Halaman ini update otomatis.
      </p>
    );
  }
  if (order.delivery_status === "FAILED") {
    return (
      <p className={cls}>
        Pengiriman ke {player} mengalami kendala (pastikan kamu pernah join server). Sistem akan
        mencoba lagi otomatis, dan admin sudah diberi tahu.
      </p>
    );
  }
  return <p className={cls}>Terima kasih! Item akan dikirim ke akun {player} oleh admin dalam waktu dekat.</p>;
}

export default function OrderStatus() {
  useSeo({ title: "Status Pesanan", path: "/order", noindex: true });
  const { ref } = useParams();
  const [order, setOrder] = useState(undefined); // undefined = loading

  useEffect(() => {
    let cancelled = false;
    let timer;
    let polls = 0;

    async function load() {
      let data = null;
      try {
        const r = await fetch(`/api/order-status?ref=${encodeURIComponent(ref)}`);
        data = await r.json();
      } catch {
        data = null;
      }
      if (cancelled) return;
      setOrder(data);
      if (isPending(data) && ++polls < MAX_POLLS) {
        timer = setTimeout(load, POLL_MS);
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ref]);

  if (order === undefined) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <p className="p">Memuat status pesanan...</p>
      </section>
    );
  }

  if (!order || order.error) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <h1 className="title gold-gradient-text">Pesanan Tidak Ditemukan</h1>
        <Link to="/store" className="mt-6 inline-block">
          <PixelButton tone="primary" className="px-6! py-5!">Kembali ke Store</PixelButton>
        </Link>
      </section>
    );
  }

  const meta = STATUS_META[order.status] ?? STATUS_META.UNPAID;
  const Icon = meta.icon;

  return (
    <section className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <PixelBox
        tone={meta.tone}
        filled={order.status === "PAID"}
        contentClassName="flex flex-col items-center gap-3 py-12 text-center"
      >
        <Icon size={36} color={order.status === "PAID" ? "#fff" : undefined} />
        <h1 className="text-[18px] gold-gradient-text">{meta.label}</h1>
        <p className="text-[12px] text-(--color-text-muted)">Ref: {order.merchant_ref}</p>

        <ul className="text-[12px] text-white/80">
          {(order.items ?? []).map((it, i) => (
            <li key={i}>
              {it.name} × {it.quantity}
            </li>
          ))}
        </ul>
        {order.coupon_code && order.discount_idr > 0 && (
          <p className="text-[11px] text-emerald-300">
            Kupon {order.coupon_code}: -Rp{Number(order.discount_idr).toLocaleString("id-ID")}
          </p>
        )}

        {order.status === "PAID" && <DeliveryNote order={order} />}
        {order.status === "UNPAID" && (
          <p className="max-w-xs text-[12px] leading-relaxed text-(--color-text-muted)">
            Selesaikan pembayaran kamu. Halaman ini akan update otomatis begitu pembayaran diterima.
          </p>
        )}
        {order.status === "EXPIRED" && (
          <p className="max-w-xs text-[12px] leading-relaxed text-(--color-text-muted)">
            Batas waktu pembayaran sudah lewat. Silakan buat pesanan baru dari Store.
          </p>
        )}

        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link to="/store">
            <PixelButton tone="neutral" className="px-6! py-5!">Kembali ke Store</PixelButton>
          </Link>
          <Link to="/orders">
            <PixelButton tone="primary" className="px-6! py-5!">Cek Pesanan Lain</PixelButton>
          </Link>
        </div>
      </PixelBox>
    </section>
  );
}
