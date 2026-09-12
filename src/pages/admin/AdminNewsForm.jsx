// src/pages/admin/AdminNewsForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

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

  if (loading) return <p className="text-neutral-400">Loading...</p>;

  const inputClass =
    "w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-white outline-none focus:border-emerald-500";
  const labelClass = "block text-sm text-neutral-400 mb-1";

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">
        {isEdit ? "Edit Post" : "Tambah Post"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Slug (buat URL, contoh: season-19-recap)</label>
          <input
            required
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Judul</label>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Excerpt (ringkasan singkat)</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => update("excerpt", e.target.value)}
            className={inputClass}
            rows={2}
          />
        </div>

        <div>
          <label className={labelClass}>URL Gambar</label>
          <input
            value={form.image}
            onChange={(e) => update("image", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Kategori</label>
            <input
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tanggal (teks bebas)</label>
            <input
              placeholder="Jan 20, 2026"
              value={form.post_date}
              onChange={(e) => update("post_date", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Author</label>
          <input
            value={form.author}
            onChange={(e) => update("author", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Content (JSON) — isi berita lengkap
          </label>
          <textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            className={`${inputClass} font-mono text-xs`}
            rows={10}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Format: array block, contoh:{" "}
            {`[{"type":"p","text":"..."}, {"type":"h2","text":"..."}, {"type":"list","items":["a","b"]}]`}
          </p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/news")}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
