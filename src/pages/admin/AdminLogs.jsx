// src/pages/admin/AdminLogs.jsx — catatan kejadian: order, pembayaran, pengiriman, error.
import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw, Trash2 } from "lucide-react";
import { adminFetch } from "../../lib/adminApi";
import { Card, PageHeader, Button, EmptyState, Spinner, Badge, Segmented } from "../../components/admin/ui";

const LEVEL_TONE = { error: "danger", warn: "warning", info: "info" };
const LEVEL_LABEL = { error: "Error", warn: "Peringatan", info: "Info" };
const SOURCE_LABEL = {
  order: "Order",
  checkout: "Checkout",
  callback: "Pembayaran",
  delivery: "Pengiriman",
  discord: "Discord",
  tripay: "Tripay",
  admin: "Admin",
};

export default function AdminLogs() {
  const [level, setLevel] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableMissing, setTableMissing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const d = await adminFetch("logs", { params: { level } });
      setLogs(d.logs ?? []);
      setTableMissing(Boolean(d.tableMissing));
      setError("");
    } catch (err) {
      setError(err.message);
    }
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 20000);
    return () => clearInterval(t);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  async function clearAll() {
    if (!window.confirm("Hapus semua log? Data pesanan tidak terpengaruh.")) return;
    try {
      await adminFetch("logs-clear", { method: "POST" });
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Log"
        description="Catatan order, pembayaran, pengiriman, dan error. Kalau ada yang tidak jalan, mulai cek dari sini."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => load()} aria-label="Muat ulang">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button variant="danger" onClick={clearAll} aria-label="Hapus semua log">
              <Trash2 size={14} />
            </Button>
          </div>
        }
      />

      <Segmented
        value={level}
        onChange={setLevel}
        options={[
          { value: "all", label: "Semua" },
          { value: "error", label: "Error" },
          { value: "warn", label: "Peringatan" },
          { value: "info", label: "Info" },
        ]}
      />

      {error && (
        <p className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      {tableMissing && (
        <div className="rounded-xl border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          Tabel log belum ada. Buka Supabase → SQL Editor, jalankan isi <code>supabase/setup.sql</code>, lalu muat ulang.
        </div>
      )}

      {loading && logs.length === 0 && <Spinner />}

      {!loading && !error && !tableMissing && logs.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada log"
          description="Log muncul saat ada order dibuat, pembayaran masuk, pengiriman, atau error."
        />
      )}

      {logs.length > 0 && (
        <Card className="divide-y divide-neutral-800">
          {logs.map((l) => (
            <div key={l.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={LEVEL_TONE[l.level] ?? "neutral"}>{LEVEL_LABEL[l.level] ?? l.level}</Badge>
                <span className="text-xs font-medium text-neutral-400">{SOURCE_LABEL[l.source] ?? l.source}</span>
                <span className="ml-auto text-xs text-neutral-500">
                  {new Date(l.created_at).toLocaleString("id-ID")}
                </span>
              </div>
              <p className="mt-1.5 break-words text-sm text-neutral-200">{l.message}</p>
              {l.meta?.hint && (
                <p className="mt-1.5 rounded-lg bg-amber-900/40 px-3 py-2 text-xs text-amber-200">💡 {l.meta.hint}</p>
              )}
              {l.meta && Object.keys(l.meta).filter((k) => k !== "hint").length > 0 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-300">Detail</summary>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-neutral-500">
                    {JSON.stringify(
                      Object.fromEntries(Object.entries(l.meta).filter(([k]) => k !== "hint")),
                      null,
                      2
                    )}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
