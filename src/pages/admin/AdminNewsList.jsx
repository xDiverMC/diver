// src/pages/admin/AdminNewsList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">News</h1>
        <Link
          to="/admin/news/new"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-2 rounded"
        >
          + Tambah Post
        </Link>
      </div>

      {loading && <p className="text-neutral-400">Loading...</p>}

      {!loading && posts.length === 0 && (
        <p className="text-neutral-400">Belum ada post.</p>
      )}

      <div className="space-y-2">
        {posts.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded p-3"
          >
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-neutral-400">
                /{p.slug} — {p.category}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/admin/news/${p.id}/edit`}
                className="text-sm px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-sm px-3 py-1 rounded bg-red-900/50 text-red-300 hover:bg-red-900"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
