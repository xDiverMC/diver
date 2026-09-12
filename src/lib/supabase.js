// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// Supabase client. The publishable/anon key below is SAFE to expose
// in frontend code — it's designed for that. Real protection comes
// from Row Level Security (RLS) policies set on each table in
// Supabase (see supabase-schema.sql).
// ─────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wyvninaekoahdwichgmw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_7DBGeGbhsKKk2u9UuaKoJA_1ZNc4M3Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
