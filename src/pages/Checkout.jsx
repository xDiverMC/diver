// src/pages/Checkout.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Loader2 } from "lucide-react";
import PixelBox from "../components/ui/PixelBox";
import PixelButton from "../components/ui/PixelButton";
import { useCart } from "../context/useCart";
import { useSeo } from "../hooks/useSeo";

export default function Checkout() {
  useSeo({ title: "Checkout", path: "/checkout", noindex: true });
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [method, setMethod] = useState("");
  const [form, setForm] = useState({ name: "", email: "", mcUsername: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items, navigate]);

  useEffect(() => {
    fetch("/api/payment-channels")
      .then((r) => r.json())
      .then((data) => {
        setChannels(data.channels ?? []);
        setLoadingChannels(false);
      })
      .catch(() => setLoadingChannels(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!method) {
      setError("Pilih metode pembayaran dulu.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          customer_name: form.name,
          customer_email: form.email,
          customer_mc_username: form.mcUsername,
          method,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal membuat transaksi.");
        setSubmitting(false);
        return;
      }

      clearCart();
      window.location.href = data.checkout_url; // ke halaman bayar Tripay
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="title gold-gradient-text">Checkout</h1>
      <p className="p">Isi data kamu, pilih metode bayar, lalu lanjut ke pembayaran.</p>

      <PixelBox
        tone="neutral"
        className="mt-8"
        contentClassName="flex flex-col gap-4"
        header={<span className="gradient-text uppercase">Order Summary</span>}
      >
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-[12px] text-(--color-text-muted)">
            <span>{item.name} × {item.qty}</span>
            <span>${(item.qty * Number(String(item.price).replace(/[^0-9.]/g, ""))).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-white/10 pt-3 text-[14px]">
          <span className="gradient-text">Total</span>
          <span className="gold-gradient-text">${subtotal.toFixed(2)}</span>
        </div>
      </PixelBox>

      <form onSubmit={handleSubmit}>
        <PixelBox
          tone="primary"
          className="mt-6"
          contentClassName="flex flex-col gap-4"
          header={<span className="gold-gradient-text uppercase">Data Kamu</span>}
        >
          <div>
            <label className="mb-1 block text-[11px] text-(--color-text-dim)">
              Username Minecraft
            </label>
            <input
              required
              value={form.mcUsername}
              onChange={(e) => setForm((f) => ({ ...f, mcUsername: e.target.value }))}
              className="w-full rounded-sm bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-(--color-primary)"
              placeholder="Steve123"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-(--color-text-dim)">
              Nama
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-sm bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-(--color-primary)"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-(--color-text-dim)">
              Email
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-sm bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-(--color-primary)"
            />
          </div>
        </PixelBox>

        <PixelBox
          tone="info"
          className="mt-6"
          contentClassName="flex flex-col gap-2"
          header={<span className="info-gradient-text uppercase">Metode Pembayaran</span>}
        >
          {loadingChannels && (
            <p className="text-[12px] text-(--color-text-dim)">Memuat metode pembayaran...</p>
          )}
          {!loadingChannels &&
            channels.map((c) => (
              <label
                key={c.code}
                className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 cursor-pointer transition ${
                  method === c.code
                    ? "border-(--color-primary) bg-(--color-primary)/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={c.code}
                  checked={method === c.code}
                  onChange={() => setMethod(c.code)}
                  className="accent-(--color-primary)"
                />
                {c.icon_url && (
                  <img src={c.icon_url} alt="" className="h-6 w-auto" />
                )}
                <span className="flex-1 text-[12.5px] text-white">{c.name}</span>
              </label>
            ))}
        </PixelBox>

        {error && (
          <p className="mt-4 text-[12px] text-red-400 bg-red-950/40 border border-red-900 rounded-sm px-3 py-2">
            {error}
          </p>
        )}

        <PixelButton
          type="submit"
          tone="success"
          filled
          icon={submitting ? Loader2 : CreditCard}
          disabled={submitting}
          className="mt-6 w-full py-5!"
        >
          {submitting ? "Memproses..." : "Lanjut ke Pembayaran"}
        </PixelButton>
      </form>
    </section>
  );
}
