// src/pages/Checkout.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, Loader2, RefreshCw, Ticket } from "lucide-react";
import PixelBox from "../components/ui/PixelBox";
import PixelButton from "../components/ui/PixelButton";
import { useCart } from "../context/useCart";
import { useSeo } from "../hooks/useSeo";

const MC_USERNAME_RE = /^\.?[A-Za-z0-9_]{3,16}$/;
const idr = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

const PENDING_ORDER_KEY = "siestanet_pending_order";

async function requestChannels() {
  let res;
  try {
    res = await fetch("/api/payment-channels");
  } catch {
    throw new Error("Tidak bisa menghubungi server. Cek koneksi internet kamu lalu coba lagi.");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // balasan bukan JSON (mis. API belum ter-deploy / jalan lewat `npm run dev`)
  }
  if (!res.ok || !data) {
    throw new Error(
      data?.error ||
        (res.status === 404 || !data
          ? "API pembayaran tidak ditemukan. Pastikan situs sudah ter-deploy di Vercel (lokal: pakai `npx vercel dev`)."
          : "Gagal memuat metode pembayaran.")
    );
  }
  if (!data.channels?.length) {
    throw new Error(data.warning || "Belum ada metode pembayaran aktif di Tripay.");
  }
  return data.channels;
}

export default function Checkout() {
  useSeo({ title: "Checkout", path: "/checkout", noindex: true });
  const { items, subtotal } = useCart();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [channelError, setChannelError] = useState("");
  const [method, setMethod] = useState("");
  const [form, setForm] = useState({ name: "", email: "", mcUsername: "" });
  const [submitting, setSubmitting] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, label, subtotal_idr, discount_idr, total_idr }
  const [couponMsg, setCouponMsg] = useState({ ok: true, text: "" });
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items, navigate]);

  useEffect(() => {
    let cancelled = false;
    requestChannels()
      .then((list) => !cancelled && setChannels(list))
      .catch((err) => !cancelled && setChannelError(err.message))
      .finally(() => !cancelled && setLoadingChannels(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function retryChannels() {
    setLoadingChannels(true);
    setChannelError("");
    requestChannels()
      .then(setChannels)
      .catch((err) => setChannelError(err.message))
      .finally(() => setLoadingChannels(false));
  }

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCheckingCoupon(true);
    setCouponMsg({ ok: true, text: "" });
    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          customer_mc_username: form.mcUsername.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoupon(null);
        setCouponMsg({ ok: false, text: data.error || "Kupon tidak valid." });
      } else {
        setCoupon(data);
        setCouponMsg({ ok: true, text: data.message });
      }
    } catch {
      setCouponMsg({ ok: false, text: "Gagal cek kupon. Coba lagi." });
    }
    setCheckingCoupon(false);
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMsg({ ok: true, text: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!MC_USERNAME_RE.test(form.mcUsername.trim())) {
      setError("Username Minecraft tidak valid (3–16 karakter: huruf, angka, underscore; Bedrock diawali titik).");
      return;
    }

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
          customer_mc_username: form.mcUsername.trim(),
          coupon_code: coupon?.code,
          method,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal membuat transaksi.");
        setSubmitting(false);
        return;
      }

      // Keranjang TIDAK dikosongkan di sini: baru dikosongkan setelah pembayaran
      // terkonfirmasi (lihat OrderStatus). Jadi kalau user menekan Back dari
      // halaman bayar, pesanannya masih ada.
      try {
        localStorage.setItem(PENDING_ORDER_KEY, data.merchant_ref ?? "");
      } catch {
        // storage diblokir — tidak apa-apa
      }
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
        {coupon && (
          <>
            <div className="flex justify-between text-[12px] text-(--color-text-muted)">
              <span>Subtotal</span>
              <span>{idr(coupon.subtotal_idr)}</span>
            </div>
            <div className="flex justify-between text-[12px] text-emerald-400">
              <span>Diskon ({coupon.code})</span>
              <span>-{idr(coupon.discount_idr)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between border-t border-white/10 pt-3 text-[14px]">
          <span className="gradient-text">Total</span>
          <span className="gold-gradient-text">
            {coupon ? idr(coupon.total_idr) : `$${subtotal.toFixed(2)}`}
          </span>
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
              maxLength={17}
            />
            <p className="mt-1 text-[10.5px] text-(--color-text-dim)">
              Pemain Bedrock: awali dengan titik, contoh <b>.Steve123</b>
            </p>
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
          tone="neutral"
          className="mt-6"
          contentClassName="flex flex-col gap-2"
          header={<span className="gradient-text uppercase">Kode Kupon</span>}
        >
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              disabled={!!coupon}
              maxLength={32}
              placeholder="Punya kode kupon?"
              className="min-w-0 flex-1 rounded-sm bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-(--color-primary) disabled:opacity-60"
            />
            {coupon ? (
              <PixelButton type="button" tone="danger" size="sm" onClick={removeCoupon}>
                Hapus
              </PixelButton>
            ) : (
              <PixelButton
                type="button"
                tone="primary"
                size="sm"
                icon={checkingCoupon ? Loader2 : Ticket}
                disabled={checkingCoupon || !couponInput.trim()}
                onClick={applyCoupon}
              >
                Pakai
              </PixelButton>
            )}
          </div>
          {couponMsg.text && (
            <p className={`text-[11.5px] ${couponMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
              {couponMsg.text}
            </p>
          )}
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
          {!loadingChannels && channelError && (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] text-red-400 bg-red-950/40 border border-red-900 rounded-sm px-3 py-2">
                {channelError}
              </p>
              <PixelButton type="button" tone="neutral" size="sm" icon={RefreshCw} onClick={retryChannels}>
                Coba lagi
              </PixelButton>
            </div>
          )}
          {!loadingChannels &&
            !channelError &&
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

        <label className="mt-6 flex items-start gap-2.5 text-[11.5px] leading-relaxed text-(--color-text-muted)">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            Saya sudah membaca dan setuju dengan{" "}
            <Link to="/terms" target="_blank" className="underline text-(--color-primary)">Syarat &amp; Ketentuan</Link>,{" "}
            <Link to="/privacy" target="_blank" className="underline text-(--color-primary)">Kebijakan Privasi</Link>, dan{" "}
            <Link to="/refund" target="_blank" className="underline text-(--color-primary)">Kebijakan Refund</Link>.
          </span>
        </label>
        <PixelButton
          type="submit"
          tone="success"
          filled
          icon={submitting ? Loader2 : CreditCard}
          disabled={submitting || !method || !agree}
          className="mt-4 w-full py-5!"
        >
          {submitting ? "Memproses..." : "Lanjut ke Pembayaran"}
        </PixelButton>
        {(!method || !agree) && !loadingChannels && !channelError && (
          <p className="mt-2 text-center text-[11px] text-(--color-text-dim)">
            {!method
              ? "Pilih metode pembayaran dulu untuk melanjutkan."
              : "Centang persetujuan di atas untuk melanjutkan."}
          </p>
        )}
      </form>
    </section>
  );
}
