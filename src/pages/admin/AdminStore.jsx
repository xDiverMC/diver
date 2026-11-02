// src/pages/admin/AdminStore.jsx — editor produk visual (tanpa edit JSON).
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Code, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { RANKS, CRATE_KEYS, CURRENCY_PACKS } from "../../data/store";
import { Card, PageHeader, Button, Field, Input, Textarea, Select, Spinner, Badge, EmptyState } from "../../components/admin/ui";
import { CATEGORIES, TONES, newProduct, slugify, validateProducts } from "../../lib/storeEditor";

const DEFAULTS = { ranks: RANKS, crate_keys: CRATE_KEYS, currency_packs: CURRENCY_PACKS };
const lines = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");

function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-300">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

function ProductCard({ p, category, open, onToggle, onChange, onMove, onDelete, isFirst, isLast }) {
  const set = (patch) => onChange(patch);
  const hasCommands = Array.isArray(p.commands) && p.commands.some((c) => c.trim());

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <ChevronDown size={16} className={`shrink-0 text-neutral-500 transition ${open ? "rotate-180" : ""}`} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-white">{p.name || "(produk baru)"}</span>
            <span className="block truncate text-xs text-neutral-500">{p.key || "belum ada ID"}</span>
          </span>
          <span className="shrink-0 text-sm text-neutral-300">{String(p.price ?? "")}</span>
          <Badge tone={hasCommands ? "success" : "neutral"}>{hasCommands ? "Otomatis" : "Manual"}</Badge>
        </button>
        <div className="flex shrink-0 gap-1">
          <button type="button" disabled={isFirst} onClick={() => onMove(-1)} aria-label="Naik"
            className="rounded p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-white disabled:opacity-30">
            <ChevronUp size={16} />
          </button>
          <button type="button" disabled={isLast} onClick={() => onMove(1)} aria-label="Turun"
            className="rounded p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-white disabled:opacity-30">
            <ChevronDown size={16} />
          </button>
          <button type="button" onClick={onDelete} aria-label="Hapus"
            className="rounded p-1.5 text-red-400 hover:bg-red-950">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {open && (
        <div className="grid gap-4 border-t border-neutral-800 p-4 sm:grid-cols-2">
          <Field label="Nama">
            <Input
              value={p.name ?? ""}
              onChange={(e) => set({ name: e.target.value, ...(p._new && !p._keyTouched ? { key: slugify(e.target.value) } : {}) })}
            />
          </Field>
          <Field label="Harga (USD)" hint="Ditagih dalam Rupiah memakai kurs di server (USD_TO_IDR).">
            <Input
              inputMode="decimal"
              value={String(p.price ?? "").replace(/^\$/, "")}
              onChange={(e) => set({ price: "$" + e.target.value })}
              placeholder="4.99"
            />
          </Field>
          <Field
            label="ID"
            hint={p._new ? "Huruf kecil/angka/-/_. Tidak bisa diubah setelah disimpan." : "Tidak bisa diubah karena dipakai di riwayat pesanan."}
          >
            <Input
              value={p.key ?? ""}
              disabled={!p._new}
              onChange={(e) => set({ key: e.target.value.toLowerCase(), _keyTouched: true })}
            />
          </Field>
          <Field label="Warna">
            <Select value={p.tone ?? ""} onChange={(e) => set({ tone: e.target.value })}>
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>

          {category === "ranks" && (
            <>
              <Field label="Warna username di game" hint="Contoh: Green">
                <Input value={p.usernameColor ?? ""} onChange={(e) => set({ usernameColor: e.target.value })} />
              </Field>
              <Field label="Daftar perk (satu per baris)">
                <Textarea rows={4} value={lines(p.perks)} onChange={(e) => set({ perks: e.target.value.split("\n") })} />
              </Field>
            </>
          )}
          {category === "crate_keys" && (
            <div className="sm:col-span-2">
              <Field label="Isi crate (satu per baris)">
                <Textarea rows={4} value={lines(p.contents)} onChange={(e) => set({ contents: e.target.value.split("\n") })} />
              </Field>
            </div>
          )}
          {category === "currency_packs" && (
            <>
              <Field label="Jumlah" hint="Contoh: 10,000 Coins">
                <Input value={p.amount ?? ""} onChange={(e) => set({ amount: e.target.value })} />
              </Field>
              <Field label="Label bonus (opsional)" hint="Contoh: +15% bonus">
                <Input value={p.bonus ?? ""} onChange={(e) => set({ bonus: e.target.value })} />
              </Field>
            </>
          )}

          <div className="sm:col-span-2">
            <Check checked={p.featured} onChange={(v) => set({ featured: v })}>Tandai sebagai unggulan</Check>
          </div>

          <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/50 p-4 sm:col-span-2">
            <div>
              <div className="text-sm font-medium text-white">Pengiriman otomatis</div>
              <p className="text-xs text-neutral-500">
                Satu command per baris, dijalankan lewat RCON setelah bayar. Pakai <code>{"{player}"}</code>,{" "}
                <code>{"{qty}"}</code>, <code>{"{ref}"}</code>. Kosongkan = dikirim manual.
              </p>
            </div>
            <Textarea
              rows={3}
              className="font-mono text-xs"
              placeholder={"lp user {player} parent add vip"}
              value={lines(p.commands)}
              onChange={(e) => set({ commands: e.target.value.split("\n") })}
            />
            <Check checked={p.repeat_per_qty} onChange={(v) => set({ repeat_per_qty: v })}>
              Ulangi command sebanyak jumlah yang dibeli
            </Check>
          </div>

          <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/50 p-4 sm:col-span-2">
            <div className="text-sm font-medium text-white">Batas pembelian (opsional)</div>
            <Check checked={p.once_per_player} onChange={(v) => set({ once_per_player: v })}>
              Hanya boleh dibeli 1x per player
            </Check>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Maks per pesanan">
                <Input type="number" min="1" value={p.max_qty ?? ""} onChange={(e) => set({ max_qty: e.target.value })} />
              </Field>
              <Field label="Maks total / player">
                <Input type="number" min="1" value={p.limit_total ?? ""} onChange={(e) => set({ limit_total: e.target.value })} />
              </Field>
              <Field label="Maks per hari / player">
                <Input type="number" min="1" value={p.limit_per_day ?? ""} onChange={(e) => set({ limit_per_day: e.target.value })} />
              </Field>
            </div>
          </div>

          {category === "ranks" && (
            <p className="text-xs text-neutral-500 sm:col-span-2">
              Tabel perbandingan perk (chat icon, bonus homes, dst.) diatur lewat <b>Mode JSON</b> di bawah.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function AdminStore() {
  const [tab, setTab] = useState("ranks");
  const [data, setData] = useState(null); // { ranks: [], crate_keys: [], currency_packs: [] }
  const [missing, setMissing] = useState({}); // kategori yang belum ada di database
  const [dirty, setDirty] = useState({});
  const [open, setOpen] = useState(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("store_content")
      .select("key, data")
      .in("key", CATEGORIES.map((c) => c.key))
      .then(({ data: rows, error }) => {
        if (cancelled) return;
        if (error) {
          setErrors([error.message]);
          setData({ ranks: [], crate_keys: [], currency_packs: [] });
          return;
        }
        const next = {};
        const miss = {};
        for (const c of CATEGORIES) {
          const row = rows?.find((r) => r.key === c.key);
          next[c.key] = row ? row.data : structuredClone(DEFAULTS[c.key]);
          if (!row) miss[c.key] = true;
        }
        setData(next);
        setMissing(miss);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return <Spinner />;

  const products = data[tab] ?? [];
  const category = CATEGORIES.find((c) => c.key === tab);

  function setProducts(next) {
    setData((d) => ({ ...d, [tab]: next }));
    setDirty((d) => ({ ...d, [tab]: true }));
    setSavedMsg("");
  }
  const patch = (i, p) => setProducts(products.map((x, idx) => (idx === i ? { ...x, ...p } : x)));
  function move(i, dir) {
    const next = [...products];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setProducts(next);
    setOpen(i + dir);
  }
  function remove(i) {
    const p = products[i];
    if (!window.confirm(`Hapus "${p.name || "produk ini"}"? Riwayat pesanan lama tidak terpengaruh.`)) return;
    setProducts(products.filter((_, idx) => idx !== i));
    setOpen(null);
  }
  function add() {
    setProducts([...products, newProduct(tab, products)]);
    setOpen(products.length);
  }

  function changeTab(key) {
    setTab(key);
    setOpen(null);
    setJsonMode(false);
    setErrors([]);
    setSavedMsg("");
  }

  function toggleJson() {
    if (!jsonMode) {
      setJsonText(JSON.stringify(products.map(({ _new, _keyTouched, ...rest }) => rest), null, 2));
      setJsonMode(true);
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("Harus berupa array [ ... ]");
      setProducts(parsed);
      setJsonMode(false);
      setErrors([]);
    } catch (e) {
      setErrors([`JSON belum valid: ${e.message}`]);
    }
  }

  async function handleSave() {
    setErrors([]);
    setSavedMsg("");

    let list = products;
    if (jsonMode) {
      try {
        list = JSON.parse(jsonText);
        if (!Array.isArray(list)) throw new Error("Harus berupa array [ ... ]");
      } catch (e) {
        setErrors([`JSON belum valid: ${e.message}`]);
        return;
      }
    }

    const { errors: errs, cleaned } = validateProducts(list);
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("store_content")
      .upsert({ key: tab, data: cleaned, updated_at: new Date().toISOString() });
    setSaving(false);

    if (error) {
      setErrors([error.message]);
      return;
    }
    setData((d) => ({ ...d, [tab]: cleaned }));
    setDirty((d) => ({ ...d, [tab]: false }));
    setMissing((m) => ({ ...m, [tab]: false }));
    setJsonMode(false);
    setSavedMsg("Tersimpan! Perubahan langsung tampil di toko.");
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Produk" description="Atur harga, isi, pengiriman otomatis, dan batas pembelian." />

      <div className="flex gap-1 border-b border-neutral-800">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => changeTab(c.key)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === c.key ? "border-emerald-500 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {c.label}
            {(dirty[c.key] || missing[c.key]) && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Belum disimpan" />}
          </button>
        ))}
      </div>

      {missing[tab] && (
        <p className="rounded-lg border border-amber-900 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
          Kategori ini masih memakai data bawaan dan <b>belum tersimpan di database</b>. Klik <b>Simpan</b> agar produknya
          bisa dibeli di checkout.
        </p>
      )}

      {jsonMode ? (
        <Card className="p-4">
          <p className="mb-2 text-sm text-neutral-400">Mode JSON (lanjutan). Jaga tanda kurung dan koma.</p>
          <Textarea rows={22} className="font-mono text-xs" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
        </Card>
      ) : products.length === 0 ? (
        <EmptyState title={`Belum ada ${category.single}`} description="Klik 'Tambah produk' untuk mulai." />
      ) : (
        <div className="space-y-2">
          {products.map((p, i) => (
            <ProductCard
              key={p._new ? `new-${i}` : p.key}
              p={p}
              category={tab}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              onChange={(patchObj) => patch(i, patchObj)}
              onMove={(dir) => move(i, dir)}
              onDelete={() => remove(i)}
              isFirst={i === 0}
              isLast={i === products.length - 1}
            />
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          <ul className="list-inside list-disc space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {savedMsg && (
        <p className="rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">{savedMsg}</p>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
        {!jsonMode && (
          <Button variant="secondary" onClick={add}>
            <Plus size={16} /> Tambah produk
          </Button>
        )}
        <Button variant="secondary" onClick={toggleJson}>
          <Code size={16} /> {jsonMode ? "Kembali ke editor" : "Mode JSON"}
        </Button>
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
