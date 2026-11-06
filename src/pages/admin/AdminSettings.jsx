// src/pages/admin/AdminSettings.jsx — notifikasi Discord + cek sistem.
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, RefreshCw, Save, Send, TriangleAlert, XCircle } from "lucide-react";
import { adminFetch } from "../../lib/adminApi";
import { Card, PageHeader, Button, Field, Input, Spinner, Badge } from "../../components/admin/ui";

const STATUS_ICON = {
  ok: <CheckCircle2 size={18} className="text-emerald-400" />,
  warn: <TriangleAlert size={18} className="text-amber-400" />,
  fail: <XCircle size={18} className="text-red-400" />,
  skip: <Clock size={18} className="text-neutral-500" />,
};

function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-300">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

function DiscordSection() {
  const [cfg, setCfg] = useState(null);
  const [events, setEvents] = useState([]);
  const [url, setUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [evState, setEvState] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState({ ok: true, text: "" });

  async function load() {
    try {
      const d = await adminFetch("settings");
      setCfg(d.discord);
      setEvents(d.eventsList);
      setEnabled(d.discord.enabled);
      setEvState(d.discord.events);
    } catch (err) {
      setMsg({ ok: false, text: err.message });
      setCfg({ hasUrl: false, enabled: true, events: {}, source: "none", urlPreview: "" });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMsg({ ok: true, text: "" });
    try {
      const discord = { enabled, events: evState };
      if (url.trim()) discord.url = url.trim();
      await adminFetch("settings-save", { method: "POST", body: { discord } });
      setUrl("");
      setMsg({ ok: true, text: "Tersimpan." });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setSaving(false);
  }

  async function removeUrl() {
    if (!window.confirm("Hapus URL webhook yang tersimpan?")) return;
    try {
      await adminFetch("settings-save", { method: "POST", body: { discord: { url: "" } } });
      setMsg({ ok: true, text: "URL dihapus." });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  async function test() {
    setTesting(true);
    setMsg({ ok: true, text: "" });
    try {
      await adminFetch("discord-test", { method: "POST" });
      setMsg({ ok: true, text: "Pesan tes terkirim — cek channel Discord kamu ✅" });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setTesting(false);
  }

  if (!cfg) return <Spinner />;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Notifikasi Discord</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Kabar order baru, pembayaran, dan pengiriman langsung masuk ke channel Discord.
          </p>
        </div>
        <Badge tone={cfg.hasUrl && cfg.enabled ? "success" : "neutral"}>
          {cfg.hasUrl ? (cfg.enabled ? "Aktif" : "Dimatikan") : "Belum diatur"}
        </Badge>
      </div>

      <Field
        label="URL webhook"
        hint={
          cfg.hasUrl
            ? `Tersimpan (${cfg.source === "admin" ? "dari panel ini" : "dari env Vercel"}, berakhiran ${cfg.urlPreview}). Isi kolom ini hanya kalau mau menggantinya.`
            : "Discord → Server Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL."
        }
      >
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          autoComplete="off"
        />
      </Field>

      <Check checked={enabled} onChange={setEnabled}>
        Aktifkan notifikasi
      </Check>

      <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-4">
        <div className="mb-2 text-sm font-medium text-white">Kirim notifikasi untuk</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {events.map((e) => (
            <Check key={e.key} checked={evState[e.key] !== false} onChange={(v) => setEvState((s) => ({ ...s, [e.key]: v }))}>
              {e.label}
            </Check>
          ))}
        </div>
      </div>

      {msg.text && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            msg.ok
              ? "border-emerald-900 bg-emerald-900/40 text-emerald-300"
              : "border-red-900 bg-red-950/40 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button variant="secondary" onClick={test} disabled={testing || !cfg.hasUrl}>
          <Send size={16} /> {testing ? "Mengirim..." : "Kirim tes"}
        </Button>
        {cfg.source === "admin" && (
          <Button variant="danger" onClick={removeUrl}>
            Hapus URL
          </Button>
        )}
      </div>
    </Card>
  );
}

function StoreSection() {
  const [target, setTarget] = useState("");
  const [hidden, setHidden] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ ok: true, text: "" });

  useEffect(() => {
    adminFetch("settings")
      .then((d) => {
        setTarget(d.goal?.monthly_target_idr ? String(d.goal.monthly_target_idr) : "");
        setHidden((d.leaderboard?.hidden ?? []).join("\n"));
      })
      .catch((err) => setMsg({ ok: false, text: err.message }))
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setSaving(true);
    setMsg({ ok: true, text: "" });
    try {
      await adminFetch("settings-save", {
        method: "POST",
        body: {
          goal: { monthly_target_idr: target.trim() === "" ? 0 : Number(target.replace(/[^0-9]/g, "")) },
          leaderboard: { hidden },
        },
      });
      setMsg({ ok: true, text: "Tersimpan. Perubahan di website bisa butuh beberapa menit (cache)." });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setSaving(false);
  }

  if (!loaded) return <Spinner />;

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-base font-semibold text-white">Target & papan donatur</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Angka "Total raised" dan jumlah donatur di halaman Store dihitung otomatis dari pesanan yang sudah dibayar.
        </p>
      </div>

      <Field
        label="Target donasi bulanan (Rp)"
        hint="Contoh: 2500000. Kosongkan atau 0 untuk menyembunyikan blok target di website."
      >
        <Input inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
      </Field>

      <Field
        label="Sembunyikan dari papan donatur"
        hint="Satu username per baris. Untuk pemain yang meminta namanya tidak ditampilkan. Pembelian mereka tetap tercatat."
      >
        <textarea
          rows={3}
          value={hidden}
          onChange={(e) => setHidden(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-emerald-500/70"
          placeholder={"Steve123\n.AlexBedrock"}
        />
      </Field>

      {msg.text && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            msg.ok
              ? "border-emerald-900 bg-emerald-900/40 text-emerald-300"
              : "border-red-900 bg-red-950/40 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}

      <Button onClick={save} disabled={saving}>
        <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
      </Button>
    </Card>
  );
}

function HealthSection() {
  const [checks, setChecks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function run(rcon = false) {
    setLoading(true);
    setError("");
    try {
      const d = await adminFetch("health", { params: rcon ? { rcon: "1" } : {} });
      setChecks(d.checks);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    run();
  }, []);

  const problems = checks?.filter((c) => c.status === "fail").length ?? 0;
  const warns = checks?.filter((c) => c.status === "warn").length ?? 0;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Cek sistem</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Memeriksa konfigurasi, database, katalog, Tripay, dan RCON. Kalau pesanan tidak muncul, mulai dari sini.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => run(false)} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Periksa ulang
          </Button>
          <Button variant="secondary" onClick={() => run(true)} disabled={loading}>
            Tes RCON
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      {loading && !checks && <Spinner />}

      {checks && (
        <>
          <p className="text-sm text-neutral-400">
            {problems === 0 && warns === 0
              ? "Semua beres ✅"
              : `${problems} masalah, ${warns} peringatan`}
          </p>
          <div className="divide-y divide-neutral-800 rounded-xl border border-white/10">
            {checks.map((c) => (
              <div key={c.id} className="flex gap-3 p-3.5">
                <div className="mt-0.5 shrink-0">{STATUS_ICON[c.status]}</div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{c.title}</div>
                  <div className="break-words text-sm text-neutral-400">{c.detail}</div>
                  {c.fix && (
                    <div className="mt-1.5 rounded-lg bg-amber-900/40 px-3 py-2 text-xs text-amber-200">
                      💡 {c.fix}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export default function AdminSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="Pengaturan" description="Notifikasi Discord, target donasi, dan pemeriksaan sistem toko." />
      <DiscordSection />
      <StoreSection />
      <HealthSection />
    </div>
  );
}
