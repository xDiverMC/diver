// src/components/RouteError.jsx — layar error yang ramah (menggantikan "Unexpected Application Error").
import { useRouteError } from "react-router-dom";

export default function RouteError() {
  const error = useRouteError();
  const detail = error?.message || error?.statusText || String(error ?? "");

  function resetAndReload() {
    try {
      localStorage.removeItem("siestanet_cart_v1");
      localStorage.removeItem("siestanet_pending_order");
    } catch {
      // abaikan
    }
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 text-center">
        <h1 className="text-lg font-semibold">Ada yang tidak beres</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Halaman ini gagal ditampilkan. Coba muat ulang. Kalau masih sama, kosongkan keranjang lalu kembali ke beranda.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
          >
            Muat ulang
          </button>
          <button
            onClick={resetAndReload}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Kosongkan keranjang
          </button>
        </div>
        {detail && (
          <details className="mt-4 text-left text-xs text-neutral-500">
            <summary className="cursor-pointer">Detail teknis</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{detail}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
