// Single source of truth for site-wide SEO metadata.
// NOTE: SITE_URL sekarang alamat Vercel. Setelah domain sendiri terpasang, ganti di sini,
// lalu samakan juga di index.html, public/sitemap.xml, dan public/robots.txt.
export const SITE_URL = "https://diver-delta.vercel.app";
export const SITE_NAME = "SiestaNet";

export const DEFAULT_TITLE =
  "SiestaNet — A Friendly Minecraft Survival Server";
export const DEFAULT_DESCRIPTION =
  "Join SiestaNet, a friendly Java & Bedrock cross-play Minecraft survival server built for our community. Vote for rewards, grab ranks and crates, and climb the leaderboards.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
// Alamat server yang tampil di halaman depan (tombol salin IP & cara join).
// TODO: ganti dengan alamat server SiestaNet yang sebenarnya.
export const SERVER_JAVA_ADDRESS = "play.bdzonemc.com";
export const SERVER_BEDROCK_ADDRESS = "pe.bdzonemc.com";
