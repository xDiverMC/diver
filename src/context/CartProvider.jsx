import { useState, useMemo, useCallback, useEffect } from "react";
import { CartContext } from "./cart-context";
import { parsePrice, parseStoredCart, serializeCart } from "./cart-utils";

const STORAGE_KEY = "bdzone_cart_v1";

// Keranjang disimpan di localStorage supaya tidak hilang saat refresh,
// pindah halaman penuh (mis. ke Tripay lalu Back), atau tab ditutup.
// `icon` (komponen React) sengaja tidak disimpan; Cart.jsx punya ikon cadangan.
function loadCart() {
  try {
    return parseStoredCart(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // Each item: { id, category, name, price, tone, image?, icon? }
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeCart(items));
    } catch {
      // storage penuh / diblokir — keranjang tetap jalan di memori
    }
  }, [items]);

  const addToCart = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, qty } : i));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + parsePrice(i.price) * i.qty, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, updateQty, clearCart, count, subtotal }),
    [items, addToCart, removeFromCart, updateQty, clearCart, count, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
