// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wyvninaekoahdwichgmw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_7DBGeGbhsKKk2u9UuaKoJA_1ZNc4M3Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
