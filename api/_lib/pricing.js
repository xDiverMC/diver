// api/_lib/pricing.js — katalog & harga SELALU dihitung ulang di server.
import { supabaseAdmin } from "./supabase.js";
import { ApiError } from "./validate.js";

export const USD_TO_IDR = Number(process.env.USD_TO_IDR) || 16000;
export const MIN_TOTAL_IDR = 1000;
const DEFAULT_MAX_QTY = 99;

const CATEGORIES = ["ranks", "crate_keys", "currency_packs"];

export function parseUsd(priceStr) {
  return Number(String(priceStr).replace(/[^0-9.]/g, "")) || 0;
}

export async function loadCatalog() {
  const { data, error } = await supabaseAdmin
    .from("store_content")
    .select("key, data")
    .in("key", CATEGORIES);
  if (error) throw new Error("Gagal memuat katalog: " + error.message);

  const catalog = [];
  for (const row of data ?? []) {
    for (const p of Array.isArray(row.data) ? row.data : []) {
      catalog.push({ ...p, category: row.key });
    }
  }
  return catalog;
}

// items: [{ id, qty }] dari client → baris harga yang tepercaya.
export async function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Keranjang kosong.");
  }

  // Gabungkan id yang dobel supaya batas qty tidak bisa dilewati.
  const qtyById = new Map();
  for (const it of items) {
    const id = String(it?.id ?? "");
    const qty = Math.floor(Number(it?.qty) || 1);
    if (!id) continue;
    qtyById.set(id, (qtyById.get(id) ?? 0) + Math.max(1, qty));
  }

  const catalog = await loadCatalog();
  const lines = [];
  for (const [id, qty] of qtyById) {
    const product = catalog.find((p) => p.key === id);
    if (!product) {
      throw new ApiError(
        400,
        `Produk "${id}" sudah tidak tersedia. Hapus dari keranjang lalu coba lagi.`
      );
    }
    const maxQty = Number(product.max_qty) || DEFAULT_MAX_QTY;
    if (qty > maxQty) {
      throw new ApiError(400, `${product.name}: maksimal ${maxQty} per pesanan.`);
    }
    const unitIdr = Math.round(parseUsd(product.price) * USD_TO_IDR);
    if (unitIdr <= 0) {
      throw new ApiError(400, `Harga ${product.name} belum diatur.`);
    }
    lines.push({ product, sku: product.key, name: product.name, qty, unitIdr });
  }

  if (lines.length === 0) throw new ApiError(400, "Keranjang tidak valid.");

  const subtotalIdr = lines.reduce((s, l) => s + l.unitIdr * l.qty, 0);
  return { lines, subtotalIdr };
}

export const toOrderItems = (lines) =>
  lines.map((l) => ({
    sku: l.sku,
    name: l.name,
    price: l.unitIdr,
    quantity: l.qty,
  }));
