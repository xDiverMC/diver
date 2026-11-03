// src/pages/admin/AdminNewsForm.jsx — tambah / edit berita (tanpa JSON).
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Button, Field, Input, Textarea, Spinner } from "../../components/admin/ui";
import { blocksToText, slugifyTitle, textToBlocks, todayLabel } from "../../lib/newsContent";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORIES = ["Update", "Event", "Pengumuman", "Maintenance", "Komunitas"];

const blank = () => ({
  slug: "",
  title: "",
  excerpt: "",
  image: "",
  category: "Update",
  post_date: todayLabel(),
  author: "SiestaNet Team",
});

function Preview({ blocks }) {
  if (!blocks.length) return <p className="text-sm text-neutral-500">Belum ada isi.</p>;
  return (
    <div className="space-y-3 text-sm leading-relaxed text-neutral-300">
      {blocks.map((b, i) =>
        b.type === "h2" ? (
          <h3 key={i} className="pt-2 text-base font-semibold text-white">{b.text}</h3>
        ) : b.type === "list" ? (
          <ul key={i} className="list-inside list-disc space-y-1">
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.text}</p>
        )
      )}
    </div>
  );
}

export default function AdminNewsForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(blank);
  const [body, setBody] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);
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
      .then(({ data, error: err }) => {
        if (data) {
          setForm({ ...blank(), ...data });
          setBody(blocksToText(data.content));
        }
        if (err) setError(err.message);
        setLoading(false);
      });
  }, [id, isEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function onTitle(e) {
    const title = e.target.value;
    setForm((f) => ({ ...f, title, ...(slugTouched ? {} : { slug: slugifyTitle(title) }) }));
  }

  const blocks = textToBlocks(body);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const title = form.title.trim();
    const slug = form.slug.trim();
    if (!title) return setError("Judul wajib diisi.");
    if (!SLUG_RE.test(slug)) return setError("Slug hanya boleh huruf kecil, angka, dan tanda - (contoh: season-19-recap).");
    if (blocks.length === 0) return setError("Isi berita masih kosong.");

    // Excerpt kosong → ambil dari paragraf pertama.
    const firstPara = blocks.find((b) => b.type === "p")?.text ?? "";
    const excerpt = form.excerpt.trim() || (firstPara.length > 160 ? firstPara.slice(0, 157) + "…" : firstPara);

    const payload = {
      slug,
      title,
      excerpt,
      image: form.image.trim(),
      category: form.category.trim() || "Update",
      post_date: form.post_date.trim() || todayLabel(),
      author: form.author.trim() || "SiestaNet Team",
      content: blocks,
    };

    setSaving(true);
    const { error: err } = isEdit
      ? await supabase.from("news_posts").update(payload).eq("id", id)
      : await supabase.from("news_posts").insert(payload);
    setSaving(false);

    if (err) {
      setError(err.code === "23505" ? "Slug itu sudah dipakai berita lain. Ganti slug-nya." : err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate("/admin/news");
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <Link to="/admin/news" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white">
        <ArrowLeft size={15} /> Kembali
      </Link>

      <PageHeader title={isEdit ? "Edit berita" : "Tambah berita"} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <Card className="space-y-4 p-5">
          <Field label="Judul">
            <Input value={form.title} onChange={onTitle} placeholder="Season 19 Resmi Dimulai!" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori">
              <Input list="news-categories" value={form.category} onChange={set("category")} />
              <datalist id="news-categories">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Tanggal" hint="Teks bebas, contoh: Nov 2, 2026">
              <Input value={form.post_date} onChange={set("post_date")} />
            </Field>
          </div>

          <Field label="Gambar (URL)" hint="Opsional. Tempel link gambar (https://…).">
            <Input value={form.image} onChange={set("image")} placeholder="https://…" />
          </Field>
          {form.image.trim() && (
            <img
              src={form.image}
              alt=""
              className="max-h-40 rounded-lg border border-white/10 object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
              onLoad={(e) => (e.currentTarget.style.display = "")}
            />
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <Field
            label="Isi berita"
            hint="Baris kosong = paragraf baru. “## Judul” = sub-judul. Baris berawalan “- ” = daftar."
          >
            <Textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Tulis isi berita di sini…\n\n## Sub-judul\n\n- Poin pertama\n- Poin kedua"}
            />
          </Field>

          <details className="rounded-lg border border-white/[0.07] bg-neutral-950/40 px-4 py-3">
            <summary className="cursor-pointer text-sm text-neutral-300">Pratinjau isi</summary>
            <div className="mt-3">
              <Preview blocks={blocks} />
            </div>
          </details>
        </Card>

        <details className="rounded-xl border border-white/[0.07] bg-neutral-900/40 px-4 py-3">
          <summary className="cursor-pointer text-sm text-neutral-300">Pengaturan lanjutan</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Slug (URL)" hint={`Alamat: /news/${form.slug || "…"}. Otomatis dari judul.`}>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }));
                }}
              />
            </Field>
            <Field label="Penulis">
              <Input value={form.author} onChange={set("author")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Ringkasan" hint="Tampil di kartu. Kosong = otomatis dari paragraf pertama.">
                <Textarea rows={2} value={form.excerpt} onChange={set("excerpt")} />
              </Field>
            </div>
          </div>
        </details>

        <div className="admin-savebar sticky z-20 -mx-4 flex items-center gap-2 border-t border-white/10 bg-neutral-950/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
          <Button type="button" variant="secondary" onClick={() => navigate("/admin/news")}>
            Batal
          </Button>
          <Button type="submit" disabled={saving} className="ml-auto">
            <Save size={16} /> {saving ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Terbitkan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
