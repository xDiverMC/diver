// src/data/staff.js
// ─────────────────────────────────────────────────────────────
// Staff roster now lives in Supabase (table: staff_members),
// managed via /admin/staff.
// ─────────────────────────────────────────────────────────────
import { supabase } from "../lib/supabase";

// Tiers in display order — highest authority first. Kept static since
// these are fixed UI categories, not editable content.
export const STAFF_TIERS = [
  { key: "owner", label: "Owner" },
  { key: "admin", label: "Administrator" },
  { key: "moderator", label: "Moderator" },
  { key: "helper", label: "Helper & Builder" },
];

export async function fetchStaff() {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}
