// src/pages/admin/AdminNewsList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Newspaper, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Button, EmptyState, Spinner, Badge } from "../../components/admin/ui";

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
    if (!confirm("Hapus berita ini?")) return;
    await supabase.from("news_posts").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Berita"
        description="Kelola berita & pengumuman yang tampil di halaman /news."
        action={
          <Link to="/admin/news/new">
            <Button>
              <Plus size={16} /> Tambah berita
            </Button>
          </Link>
        }
      />

      {loading && <Spinner />}

      {!loading && posts.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="Belum ada berita"
          description="Klik “Tambah berita” untuk menulis yang pertama."
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
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <Badge tone="info">{p.category}</Badge>
                  <span>{p.post_date}</span>
                  <span className="truncate">/{p.slug}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={`/news/${p.slug}`} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Lihat">
                  <ExternalLink size={16} />
                </a>
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
