// src/pages/admin/AdminCoupons.jsx — kelola kode kupon diskon.
import { useEffect, useState } from "react";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  Card, PageHeader, Button, Field, Input, Select, EmptyState, Spinner, Badge,
} from "../../components/admin/ui";

const EMPTY = {
  code: "",
  type: "percent",
  value: "",
  max_discount_idr: "",
  min_order_idr: "",
  max_uses: "",
  expires_at: "",
  one_per_player: false,
};

const num = (v) => (v === "" || v == null ? null : Math.max(0, Math.floor(Number(v))));
const idr = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    setError("");

    const code = form.code.trim().toUpperCase();
    const value = num(form.value);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return setError("Kode: 3–32 karakter (A-Z, 0-9, _ atau -).");
    if (!value || value < 1) return setError("Nilai diskon wajib diisi.");
    if (form.type === "percent" && value > 100) return setError("Persen maksimal 100.");

    setSaving(true);
    const { error: err } = await supabase.from("coupons").insert({
      code,
      type: form.type,
      value,
      max_discount_idr: form.type === "percent" ? num(form.max_discount_idr) : null,
      min_order_idr: num(form.min_order_idr) ?? 0,
      max_uses: num(form.max_uses),
      expires_at: form.expires_at ? new Date(form.expires_at + "T23:59:59").toISOString() : null,
      one_per_player: form.one_per_player,
    });
    setSaving(false);

    if (err) {
      setError(err.code === "23505" ? "Kode itu sudah ada." : err.message);
      return;
    }
    setForm(EMPTY);
    load();
  }

  async function toggleActive(c) {
    await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    load();
  }

  async function remove(c) {
    if (!window.confirm(`Hapus kupon ${c.code}?`)) return;
    await supabase.from("coupons").delete().eq("id", c.id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Kupon"
        description="Buat kode diskon untuk checkout. Pemakaian dihitung saat pembayaran berhasil."
      />

      <Card className="p-5 mb-6">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <Field label="Kode">
            <Input value={form.code} onChange={set("code")} placeholder="HEMAT10" maxLength={32} />
          </Field>
          <Field label="Jenis">
            <Select value={form.type} onChange={set("type")}>
              <option value="percent">Persen (%)</option>
              <option value="fixed">Potongan tetap (Rp)</option>
            </Select>
          </Field>
          <Field label={form.type === "percent" ? "Diskon (%)" : "Potongan (Rp)"}>
            <Input type="number" min="1" value={form.value} onChange={set("value")} />
          </Field>
          {form.type === "percent" && (
            <Field label="Maks. diskon (Rp)" hint="Kosongkan = tanpa batas">
              <Input type="number" min="0" value={form.max_discount_idr} onChange={set("max_discount_idr")} />
            </Field>
          )}
          <Field label="Minimal belanja (Rp)">
            <Input type="number" min="0" value={form.min_order_idr} onChange={set("min_order_idr")} />
          </Field>
          <Field label="Kuota pemakaian" hint="Kosongkan = tanpa batas">
            <Input type="number" min="1" value={form.max_uses} onChange={set("max_uses")} />
          </Field>
          <Field label="Berlaku sampai" hint="Kosongkan = tanpa batas waktu">
            <Input type="date" value={form.expires_at} onChange={set("expires_at")} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-neutral-300 sm:self-end sm:pb-2">
            <input type="checkbox" checked={form.one_per_player} onChange={set("one_per_player")} />
            Hanya sekali per player
          </label>

          {error && (
            <p className="sm:col-span-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              <Plus size={16} /> {saving ? "Menyimpan..." : "Buat Kupon"}
            </Button>
          </div>
        </form>
      </Card>

      {loading && <Spinner />}
      {!loading && coupons.length === 0 && (
        <EmptyState icon={Ticket} title="Belum ada kupon" description="Buat kupon pertamamu di atas." />
      )}

      {!loading && coupons.length > 0 && (
        <Card className="divide-y divide-neutral-800">
          {coupons.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            const exhausted = c.max_uses != null && c.used_count >= c.max_uses;
            return (
              <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-white">{c.code}</span>
                    <Badge tone={c.active && !expired && !exhausted ? "success" : "neutral"}>
                      {!c.active ? "Nonaktif" : expired ? "Kedaluwarsa" : exhausted ? "Habis" : "Aktif"}
                    </Badge>
                    {c.one_per_player && <Badge tone="info">1x per player</Badge>}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {c.type === "percent"
                      ? `${c.value}%${c.max_discount_idr ? ` (maks ${idr(c.max_discount_idr)})` : ""}`
                      : idr(c.value)}
                    {c.min_order_idr > 0 && ` · min ${idr(c.min_order_idr)}`}
                    {" · dipakai "}
                    {c.used_count}
                    {c.max_uses != null ? `/${c.max_uses}` : "×"}
                    {c.expires_at && ` · sampai ${new Date(c.expires_at).toLocaleDateString("id-ID")}`}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => toggleActive(c)}>
                    {c.active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button variant="danger" onClick={() => remove(c)} aria-label="Hapus">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
