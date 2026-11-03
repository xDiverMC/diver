// src/lib/adminApi.js — panggil /api/admin dengan token login Supabase.
import { supabase } from "./supabase";

export async function adminFetch(action, { method = "GET", body, params } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? "";
  const qs = new URLSearchParams({ action, ...(params ?? {}) });

  let res;
  try {
    res = await fetch(`/api/admin?${qs}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Tidak bisa menghubungi server. Cek koneksi internet.");
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // balasan bukan JSON
  }
  if (!res.ok) {
    throw new Error(
      json?.error ||
        (res.status === 404
          ? "API admin tidak ditemukan. Pastikan situs sudah ter-deploy di Vercel (lokal: pakai `npx vercel dev`)."
          : `Permintaan gagal (HTTP ${res.status}).`)
    );
  }
  return json ?? {};
}
