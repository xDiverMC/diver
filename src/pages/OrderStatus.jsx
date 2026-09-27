// src/pages/OrderStatus.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, PartyPopper } from "lucide-react";
import PixelBox from "../components/ui/PixelBox";
import PixelButton from "../components/ui/PixelButton";
import { useSeo } from "../hooks/useSeo";

const STATUS_META = {
  PAID: { icon: PartyPopper, tone: "success", label: "Pembayaran Berhasil!" },
  UNPAID: { icon: Clock, tone: "info", label: "Menunggu Pembayaran" },
  EXPIRED: { icon: XCircle, tone: "danger", label: "Pesanan Kedaluwarsa" },
  FAILED: { icon: XCircle, tone: "danger", label: "Pembayaran Gagal" },
};

export default function OrderStatus() {
  useSeo({ title: "Status Pesanan", path: "/order", noindex: true });
  const { ref } = useParams();
  const [order, setOrder] = useState(undefined); // undefined = loading

  useEffect(() => {
    fetch(`/api/order-status?ref=${ref}`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => setOrder(null));
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
        <p className="text-[12px] text-(--color-text-muted)">
          Ref: {order.merchant_ref}
        </p>
        {order.status === "PAID" && (
          <p className="max-w-xs text-[12px] leading-relaxed text-white/80">
            Terima kasih! Item kamu akan dikirim ke akun{" "}
            <b>{order.customer_mc_username}</b> oleh admin dalam waktu dekat.
          </p>
        )}
        {order.status === "UNPAID" && (
          <p className="max-w-xs text-[12px] leading-relaxed text-(--color-text-muted)">
            Selesaikan pembayaran kamu. Halaman ini akan update otomatis
            begitu pembayaran diterima.
          </p>
        )}
        <Link to="/store" className="mt-2">
          <PixelButton tone="neutral" className="px-6! py-5!">
            Kembali ke Store
          </PixelButton>
        </Link>
      </PixelBox>
    </section>
  );
}
