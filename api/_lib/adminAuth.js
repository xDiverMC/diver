// api/_lib/adminAuth.js — verifikasi token login Supabase untuk endpoint admin.
import { supabaseAdmin } from "./supabase.js";
import { ApiError } from "./validate.js";

export async function requireAdmin(req) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new ApiError(401, "Belum login.");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new ApiError(401, "Sesi tidak valid. Login ulang.");

  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length && !allow.includes((data.user.email ?? "").toLowerCase())) {
    throw new ApiError(403, "Akun ini bukan admin.");
  }
  return data.user;
}
