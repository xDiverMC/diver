// src/pages/admin/AdminNewsForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Button, Field, Input, Textarea, Spinner } from "../../components/admin/ui";

const emptyPost = {
  slug: "",
  title: "",
  excerpt: "",
  image: "",
  category: "Update",
  post_date: "",
  author: "BD Zone Team",
  content: [{ type: "p", text: "" }],
};

export default function AdminNewsForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyPost);
  const [contentText, setContentText] = useState(
    JSON.stringify(emptyPost.content, null, 2)
  );
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    supabase
      .from("news_posts")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setForm(data);
          setContentText(JSON.stringify(data.content ?? [], null, 2));
        }
        if (error) setError(error.message);
        setLoading(false);
      });
  }, [id, isEdit]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    let parsedContent;
    try {
      parsedContent = JSON.parse(contentText);
    } catch {
      setError("Format 'Content (JSON)' salah — cek tanda kurung/koma.");
      return;
    }

    setSaving(true);
    const payload = { ...form, content: parsedContent };
    delete payload.id;
    delete payload.created_at;

    const { error } = isEdit
      ? await supabase.from("news_posts").update(payload).eq("id", id)
      : await supabase.from("news_posts").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/admin/news");
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <Link
        to="/admin/news"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white mb-4"
      >
        <ArrowLeft size={15} /> Kembali ke News
      </Link>

      <PageHeader title={isEdit ? "Edit Post" : "Tambah Post"} />

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Slug" hint="Dipakai di URL, contoh: season-19-recap">
            <Input
              required
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
            />
          </Field>

          <Field label="Judul">
            <Input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </Field>

          <Field label="Excerpt" hint="Ringkasan singkat yang tampil di kartu">
            <Textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
            />
          </Field>

          <Field label="URL Gambar">
            <Input
              value={form.image}
              onChange={(e) => update("image", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kategori">
              <Input
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              />
            </Field>
            <Field label="Tanggal" hint="Teks bebas, contoh: Jan 20, 2026">
              <Input
                value={form.post_date}
                onChange={(e) => update("post_date", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Author">
            <Input
              value={form.author}
              onChange={(e) => update("author", e.target.value)}
            />
          </Field>

          <Field
            label="Content (JSON)"
            hint={`Array block, contoh: [{"type":"p","text":"..."}, {"type":"h2","text":"..."}, {"type":"list","items":["a","b"]}]`}
          >
            <Textarea
              rows={10}
              className="font-mono text-xs"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
            />
          </Field>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving}>
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/admin/news")}
            >
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
