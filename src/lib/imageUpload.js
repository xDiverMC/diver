// src/lib/imageUpload.js — kecilkan gambar di browser, lalu unggah lewat /api/admin (upload-image).
import { adminFetch } from "./adminApi";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const TARGET_BYTES = 1.6 * 1024 * 1024; // jauh di bawah batas server (3 MB) & batas body Vercel (4,5 MB)

function loadBitmap(file) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("File tidak bisa dibaca sebagai gambar."));
    img.src = URL.createObjectURL(file);
  });
}

const toBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Gagal membaca gambar."));
    r.readAsDataURL(blob);
  });
}

/** Perkecil (maks 1600px) dan ubah ke WebP; ulangi dengan ukuran/kualitas lebih kecil bila masih besar. */
export async function compressImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Pilih file JPG, PNG, atau WebP.");
  }
  if (file.size > MAX_INPUT_BYTES) throw new Error("File terlalu besar (maksimal 15 MB).");

  const bitmap = await loadBitmap(file);
  let maxSide = 1600;
  let quality = 0.85;

  for (let attempt = 0; attempt < 4; attempt++) {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await toBlob(canvas, "image/webp", quality);
    if (!blob) throw new Error("Peramban ini tidak bisa memproses gambar. Coba peramban lain.");
    if (blob.size <= TARGET_BYTES) return blobToDataUrl(blob);

    maxSide = Math.round(maxSide * 0.75);
    quality = Math.max(0.6, quality - 0.1);
  }
  throw new Error("Gambar masih terlalu besar setelah dikecilkan. Pilih gambar lain.");
}

/** Kompres lalu unggah. Mengembalikan URL publik gambar. */
export async function uploadImage(file) {
  const dataUrl = await compressImage(file);
  const { url } = await adminFetch("upload-image", { method: "POST", body: { dataUrl } });
  return url;
}
