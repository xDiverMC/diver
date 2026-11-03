// api/_lib/supabase.js — klien Supabase dengan service role (SERVER ONLY).
// Folder _lib tidak dihitung sebagai serverless function oleh Vercel.
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://wyvninaekoahdwichgmw.supabase.co";

// Bersihkan kesalahan tempel yang umum: spasi, baris baru, atau tanda kutip di ujung.
const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
  .trim()
  .replace(/^["']|["']$/g, "");

export const supabaseAdmin = createClient(SUPABASE_URL, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Jenis kunci yang terpasang di SUPABASE_SERVICE_ROLE_KEY (tanpa membocorkan isinya).
 * Kunci "anon"/"publishable" itu untuk browser dan TIDAK punya izin ke tabel orders.
 */
export function describeServiceKey() {
  if (!serviceKey) return { kind: "missing" };
  if (serviceKey.startsWith("sb_secret_")) return { kind: "secret" };
  if (serviceKey.startsWith("sb_publishable_")) return { kind: "publishable" };
  const parts = serviceKey.split(".");
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")).role;
      if (role === "service_role") return { kind: "service_role" };
      if (role === "anon") return { kind: "anon" };
      return { kind: "unknown", role };
    } catch {
      // bukan JWT yang valid
    }
  }
  return { kind: "unknown" };
}

export const keyHasServerPrivileges = (k) => k.kind === "secret" || k.kind === "service_role";
