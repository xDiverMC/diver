// src/layouts/AdminLayout.jsx
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Package,
  ShoppingBag,
  Ticket,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const SECTIONS = [
  {
    title: "Toko",
    links: [
      { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/orders", label: "Pesanan", icon: Package, badge: true },
      { to: "/admin/store", label: "Produk", icon: ShoppingBag },
      { to: "/admin/coupons", label: "Kupon", icon: Ticket },
    ],
  },
  {
    title: "Konten",
    links: [
      { to: "/admin/news", label: "Berita", icon: Newspaper },
      { to: "/admin/staff", label: "Staff", icon: Users },
    ],
  },
];

function NavItem({ link, todo, compact }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.to}
      end={link.end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
          compact ? "px-3 py-2" : "px-3 py-2.5"
        } ${isActive ? "bg-emerald-600 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"}`
      }
    >
      <Icon size={16} />
      <span className="flex-1">{link.label}</span>
      {link.badge && todo > 0 && (
        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {todo}
        </span>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [todo, setTodo] = useState(0);

  // Jumlah pesanan dibayar yang belum terkirim → badge merah di menu Pesanan.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "PAID")
        .eq("fulfilled", false);
      if (!cancelled) setTodo(count ?? 0);
    }
    refresh();
    const t = setInterval(refresh, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  const flat = SECTIONS.flatMap((s) => s.links);

  return (
    <div className="min-h-screen bg-neutral-950 text-white md:flex">
      {/* Desktop: sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-neutral-800 md:p-4 md:sticky md:top-0 md:h-screen">
        <div className="mb-6 px-2">
          <div className="text-lg font-bold">BDZONE</div>
          <div className="text-xs text-neutral-500">Admin Panel</div>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
                {s.title}
              </div>
              <div className="flex flex-col gap-1">
                {s.links.map((l) => (
                  <NavItem key={l.to} link={l} todo={todo} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 flex flex-col gap-1 border-t border-neutral-800 pt-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white"
          >
            <ExternalLink size={16} /> Lihat Website
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-neutral-900"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile: bar atas yang bisa digeser */}
      <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="font-bold">BDZONE Admin</span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-red-400">
            <LogOut size={14} /> Logout
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {flat.map((l) => (
            <NavItem key={l.to} link={l} todo={todo} compact />
          ))}
        </nav>
      </header>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
