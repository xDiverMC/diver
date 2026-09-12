// src/pages/admin/AdminStaffList.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, X, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  Card,
  PageHeader,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  EmptyState,
  Spinner,
  Badge,
} from "../../components/admin/ui";

const TIERS = [
  { key: "owner", label: "Owner" },
  { key: "admin", label: "Administrator" },
  { key: "moderator", label: "Moderator" },
  { key: "helper", label: "Helper & Builder" },
];

const emptyMember = {
  username: "",
  role: "",
  tier: "helper",
  bio: "",
  discord: "",
  online: false,
  sort_order: 0,
};

export default function AdminStaffList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // member object | "new" | null
  const [form, setForm] = useState(emptyMember);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error) setMembers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm({ ...emptyMember, sort_order: members.length });
    setEditing("new");
    setError("");
  }

  function openEdit(m) {
    setForm(m);
    setEditing(m.id);
    setError("");
  }

  function closeForm() {
    setEditing(null);
  }

  async function handleDelete(id) {
    if (!confirm("Hapus staff ini?")) return;
    await supabase.from("staff_members").delete().eq("id", id);
    load();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = { ...form };
    delete payload.id;
    delete payload.created_at;

    const { error } =
      editing === "new"
        ? await supabase.from("staff_members").insert(payload)
        : await supabase.from("staff_members").update(payload).eq("id", editing);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(null);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Kelola daftar staff yang tampil di halaman /staff"
        action={
          <Button onClick={openNew}>
            <Plus size={16} /> Tambah Staff
          </Button>
        }
      />

      {loading && <Spinner />}

      {!loading && members.length === 0 && (
        <EmptyState
          icon={Users}
          title="Belum ada staff"
          description="Tambah anggota staff pertama kamu."
        />
      )}

      {!loading && members.length > 0 && (
        <Card className="divide-y divide-neutral-800 mb-6">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{m.username}</span>
                  <Badge tone={m.online ? "success" : "neutral"}>
                    {m.online ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5 truncate">
                  {m.role} · {TIERS.find((t) => t.key === m.tier)?.label ?? m.tier}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" onClick={() => openEdit(m)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(m.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {editing && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">
              {editing === "new" ? "Tambah Staff" : "Edit Staff"}
            </h2>
            <button onClick={closeForm} className="text-neutral-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Username">
                <Input
                  required
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </Field>
              <Field label="Tier">
                <Select
                  value={form.tier}
                  onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                >
                  {TIERS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Role/Jabatan" hint="Contoh: Lead Developer">
              <Input
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
            </Field>

            <Field label="Bio">
              <Textarea
                rows={2}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Discord username">
                <Input
                  value={form.discord}
                  onChange={(e) => setForm((f) => ({ ...f, discord: e.target.value }))}
                />
              </Field>
              <Field label="Urutan tampil" hint="Angka kecil tampil duluan">
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
                  }
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={form.online}
                onChange={(e) => setForm((f) => ({ ...f, online: e.target.checked }))}
              />
              Tandai online
            </label>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving}>
                <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
