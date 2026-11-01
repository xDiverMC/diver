// Generate public/sitemap.xml before every build (npm run build -> prebuild).
// Static pages + news posts from Supabase (table: news_posts).
// If Supabase can't be reached, the build still continues and the
// script keeps the existing sitemap.xml instead of failing.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = (process.env.PUBLIC_SITE_URL || "https://www.bdzone.net").replace(/\/$/, "");
const OUT = resolve(root, "public/sitemap.xml");

const staticPages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/news", changefreq: "daily", priority: "0.8" },
  { path: "/votes", changefreq: "weekly", priority: "0.7" },
  { path: "/store", changefreq: "weekly", priority: "0.7" },
  { path: "/staff", changefreq: "monthly", priority: "0.5" },
];

// Reuse the URL + publishable key already in src/lib/supabase.js
const src = readFileSync(resolve(root, "src/lib/supabase.js"), "utf8");
const url = process.env.VITE_SUPABASE_URL || src.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)?.[1];
const key =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  src.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*"([^"]+)"/)?.[1];

async function fetchPosts() {
  const res = await fetch(`${url}/rest/v1/news_posts?select=slug,post_date,created_at&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Supabase responded ${res.status}`);
  return res.json();
}

const entry = ({ path, lastmod, changefreq, priority }) =>
  [
    "  <url>",
    `    <loc>${SITE}${path}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");

try {
  const posts = await fetchPosts();
  const pages = [
    ...staticPages,
    ...posts
      .filter((p) => p.slug)
      .map((p) => ({
        path: `/news/${p.slug}`,
        lastmod: new Date(p.post_date || p.created_at).toISOString().slice(0, 10),
        changefreq: "monthly",
        priority: "0.6",
      })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(entry).join("\n")}\n</urlset>\n`;
  writeFileSync(OUT, xml);
  console.log(`sitemap: ${pages.length} URLs written`);
} catch (err) {
  console.warn(`sitemap: skipped (${err.message}). ${existsSync(OUT) ? "Keeping existing sitemap.xml." : "No sitemap.xml present."}`);
}
