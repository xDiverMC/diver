// api/_lib/supabase.js — klien Supabase dengan service role (SERVER ONLY).
// Folder _lib tidak dihitung sebagai serverless function oleh Vercel.
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://wyvninaekoahdwichgmw.supabase.co";

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
