// Prices in the store data are display strings like "$4.99" — pull the
// numeric value out so the cart can total things up.
export function parsePrice(price) {
  if (typeof price === "number") return price;
  const num = parseFloat(String(price).replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

// Ikon dari lucide-react adalah komponen React (function / forwardRef) dan TIDAK bisa
// disimpan ke JSON — setelah dimuat ulang jadi objek biasa dan membuat React crash
// (error #130). Karena itu `icon` tidak pernah disimpan, dan kalau ada sisa data lama
// yang memuatnya, dibuang di sini.
export function isValidIcon(icon) {
  return (
    typeof icon === "function" ||
    (icon !== null && typeof icon === "object" && "$$typeof" in icon)
  );
}

export function serializeCart(items) {
  return JSON.stringify(items.map(({ icon: _icon, ...rest }) => rest));
}

export function parseStoredCart(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.id === "string" && i.qty > 0)
      .map(({ icon: _icon, ...rest }) => rest);
  } catch {
    return [];
  }
}
