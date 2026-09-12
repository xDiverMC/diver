// src/pages/admin/AdminStore.jsx
// Ranks/Crate Keys/Currency Packs punya struktur cukup kompleks (nested
// perks, contents dll), jadi tiap kategori diedit sebagai satu blok JSON
// -- sama polanya dengan Content di News.
import { useEffect, useState } from "react";
import { Save, ShoppingBag } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Button, Textarea, Spinner } from "../../components/admin/ui";

const TABS = [
  { key: "ranks", label: "Ranks" },
  { key: "crate_keys", label: "Crate Keys" },
  { key: "currency_packs", label: "Currency Packs" },
];

export default function AdminStore() {
  const [tab, setTab] = useState("ranks");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  async function loadTab(key) {
    setLoading(true);
    setError("");
    setSavedMsg("");
    const { data, error } = await supabase
      .from("store_content")
      .select("data")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      setError(error.message);
    } else {
      setText(JSON.stringify(data?.data ?? [], null, 2));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTab(tab);
  }, [tab]);

  async function handleSave() {
    setError("");
    setSavedMsg("");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Format JSON salah — cek tanda kurung/koma.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("store_content")
      .upsert({ key: tab, data: parsed, updated_at: new Date().toISOString() });
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSavedMsg("Tersimpan!");
  }

  return (
    <div>
      <PageHeader
        title="Store"
        description="Kelola Ranks, Crate Keys, dan Currency Packs yang tampil di halaman /store"
      />

      <div className="flex gap-1 mb-4 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key
                ? "border-emerald-500 text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-5">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
              <ShoppingBag size={15} />
              Edit sebagai JSON. Struktur ikut format yang sudah ada — hati-hati jaga
              tanda kurung <code className="text-neutral-300">[ ] {"{ }"}</code> dan koma.
            </div>
            <Textarea
              rows={20}
              className="font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {error && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2 mt-3">
                {error}
              </p>
            )}
            {savedMsg && (
              <p className="text-emerald-400 text-sm bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2 mt-3">
                {savedMsg}
              </p>
            )}

            <div className="pt-4">
              <Button onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
