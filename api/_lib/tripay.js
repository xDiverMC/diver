// api/_lib/tripay.js — pilih endpoint Tripay sesuai mode.
// Kunci API sandbox dan production BERBEDA; salah mode = metode pembayaran kosong.
export function tripayBase() {
  return process.env.TRIPAY_MODE === "sandbox"
    ? "https://tripay.co.id/api-sandbox"
    : "https://tripay.co.id/api";
}
