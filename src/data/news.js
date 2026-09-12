// src/data/news.js
// ─────────────────────────────────────────────────────────────
// News posts now live in Supabase (table: news_posts), managed via
// /admin/news. These functions fetch + map rows into the shape the
// UI components expect (post_date -> date).
// ─────────────────────────────────────────────────────────────
import { supabase } from "../lib/supabase";

function mapRow(row) {
  return { ...row, date: row.post_date };
}

export async function fetchNewsPosts() {
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data.map(mapRow);
}

export async function fetchPostBySlug(slug) {
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}
