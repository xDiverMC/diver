// src/lib/storeEditor.js — logika editor produk (murni, tanpa React) supaya mudah dites.
export const CATEGORIES = [
  { key: "ranks", label: "Ranks", single: "rank" },
  { key: "crate_keys", label: "Crate Keys", single: "crate key" },
  { key: "currency_packs", label: "Currency", single: "paket currency" },
];

export const TONES = [
  { value: "", label: "Default" },
  { value: "neutral", label: "Abu-abu" },
  { value: "primary", label: "Emas" },
  { value: "info", label: "Biru" },
  { value: "success", label: "Hijau" },
  { value: "pink", label: "Pink" },
];

const KEY_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;
const UNKNOWN_PLACEHOLDER_RE = /\{(?!player\}|qty\}|ref\})[^}]*\}/;

export function slugify(name) {
  return String(name ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function priceNumber(price) {
  const n = parseFloat(String(price ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const posInt = (v) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

// Produk baru. Untuk rank, salin kerangka `values` dari rank pertama (semua dinolkan)
// supaya tabel perk di halaman store tidak error.
export function newProduct(category, existing = []) {
  const base = { _new: true, key: "", name: "", price: "$0.00", tone: "" };
  if (category === "ranks") {
    const tpl = existing.find((r) => r.values)?.values ?? {};
    const values = {};
    for (const [k, v] of Object.entries(tpl)) values[k] = typeof v === "boolean" ? false : 0;
    return { ...base, usernameColor: "", perks: [], values };
  }
  if (category === "crate_keys") return { ...base, contents: [] };
  return { ...base, amount: "", bonus: "" };
}

export function normalizeProduct(p) {
  const out = { ...p };
  delete out._new;
  delete out._keyTouched;

  out.key = String(p.key ?? "").trim();
  out.name = String(p.name ?? "").trim();
  out.price = "$" + priceNumber(p.price).toFixed(2);

  for (const f of ["perks", "contents", "commands"]) {
    if (!Array.isArray(p[f])) continue;
    const lines = p[f].map((s) => String(s).trim()).filter(Boolean);
    if (lines.length || f !== "commands") out[f] = lines;
    else delete out.commands;
  }

  for (const f of ["max_qty", "limit_total", "limit_per_day"]) {
    const n = posInt(p[f]);
    if (n) out[f] = n;
    else delete out[f];
  }
  for (const f of ["once_per_player", "repeat_per_qty", "featured"]) {
    if (p[f]) out[f] = true;
    else delete out[f];
  }
  for (const f of ["usernameColor", "amount", "bonus"]) {
    if (f in out) {
      out[f] = String(out[f] ?? "").trim();
      if (!out[f] && f === "bonus") delete out[f];
    }
  }
  return out;
}

export function validateProducts(list) {
  const errors = [];
  const seen = new Set();
  list.forEach((p, i) => {
    const n = normalizeProduct(p);
    const who = n.name ? `"${n.name}"` : `Produk #${i + 1}`;
    if (!n.name) errors.push(`${who}: nama masih kosong.`);
    if (!KEY_RE.test(n.key)) errors.push(`${who}: ID hanya boleh huruf kecil, angka, - atau _ (maks 32).`);
    else if (seen.has(n.key)) errors.push(`${who}: ID "${n.key}" dipakai produk lain.`);
    seen.add(n.key);
    if (priceNumber(p.price) <= 0) errors.push(`${who}: harga harus lebih dari 0.`);
    for (const c of n.commands ?? []) {
      if (UNKNOWN_PLACEHOLDER_RE.test(c)) {
        errors.push(`${who}: command "${c}" punya placeholder tak dikenal (hanya {player}, {qty}, {ref}).`);
      }
    }
  });
  return { errors, cleaned: errors.length ? null : list.map(normalizeProduct) };
}
