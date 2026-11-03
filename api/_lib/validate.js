// api/_lib/validate.js
export class ApiError extends Error {
  constructor(status, message, { log = false } = {}) {
    super(message);
    this.status = status;
    this.log = log; // true → dicatat ke system_logs (kegagalan yang perlu diselidiki admin)
  }
}

// Java: 3-16 huruf/angka/underscore. Bedrock (Floodgate): diawali titik.
// Regex ketat ini JUGA mencegah command injection di RCON.
export const MC_USERNAME_RE = /^\.?[A-Za-z0-9_]{3,16}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function sendError(res, err) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server." });
}

export const formatIDR = (n) =>
  "Rp" + Number(n || 0).toLocaleString("id-ID");

// Zona waktu bisnis (WITA = UTC+8). Dipakai untuk "hari ini" & "bulan ini".
export const TZ_OFFSET_HOURS = Number(process.env.TZ_OFFSET_HOURS ?? 8);

export function startOfDayUtc(now = new Date()) {
  const shifted = new Date(now.getTime() + TZ_OFFSET_HOURS * 3600e3);
  const startShifted = Date.UTC(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()
  );
  return new Date(startShifted - TZ_OFFSET_HOURS * 3600e3);
}

export function startOfMonthUtc(now = new Date()) {
  const shifted = new Date(now.getTime() + TZ_OFFSET_HOURS * 3600e3);
  const startShifted = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1);
  return new Date(startShifted - TZ_OFFSET_HOURS * 3600e3);
}
