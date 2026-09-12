// src/pages/admin/AdminNewsList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Newspaper } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Button, EmptyState, Spinner } from "../../components/admin/ui";

export default function AdminNewsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("news_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Hapus post ini?")) return;
    await supabase.from("news_posts").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="News"
        description="Kelola berita & pengumuman yang tampil di halaman /news"
        action={
          <Link to="/admin/news/new">
            <Button>
              <Plus size={16} /> Tambah Post
            </Button>
          </Link>
        }
      />

      {loading && <Spinner />}

      {!loading && posts.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="Belum ada post"
          description="Tambah post pertama kamu buat mulai isi halaman News."
        />
      )}

      {!loading && posts.length > 0 && (
        <Card className="divide-y divide-neutral-800">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <div className="font-medium text-white truncate">{p.title}</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  /{p.slug} · {p.category}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link to={`/admin/news/${p.id}/edit`}>
                  <Button variant="secondary">
                    <Pencil size={14} /> Edit
                  </Button>
                </Link>
                <Button variant="danger" onClick={() => handleDelete(p.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
