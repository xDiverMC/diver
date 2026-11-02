// src/layouts/AdminLayout.jsx — sidebar minimalis (desktop) + bottom bar (HP).
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
import "../styles/admin.css";

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

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-neutral-950"
        style={{ background: "linear-gradient(135deg,#34d399,#059669)" }}
      >
        B
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">BDZONE</div>
        <div className="text-[11px] text-neutral-500">Admin</div>
      </div>
    </div>
  );
}

function SideLink({ link, todo }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.to}
      end={link.end}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          isActive ? "bg-white/[0.06] font-medium text-white" : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={isActive ? "text-emerald-400" : "text-neutral-500 group-hover:text-neutral-300"} />
          <span className="flex-1">{link.label}</span>
          {link.badge && todo > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              {todo}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function TabLink({ link, todo }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.to}
      end={link.end}
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
          isActive ? "text-emerald-400" : "text-neutral-500"
        }`
      }
    >
      <span className="relative">
        <Icon size={20} />
        {link.badge && todo > 0 && (
          <span className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">
            {todo}
          </span>
        )}
      </span>
      {link.label}
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
    <div className="admin-root min-h-screen bg-neutral-950 text-neutral-100 md:flex">
      {/* Desktop: sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:border-r md:border-white/5 md:px-3 md:py-5">
        <div className="mb-8 px-2">
          <Logo />
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-widest text-neutral-600">
                {s.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {s.links.map((l) => (
                  <SideLink key={l.to} link={l} todo={todo} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-0.5 border-t border-white/5 pt-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-white"
          >
            <ExternalLink size={16} className="text-neutral-500" /> Lihat website
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-red-400"
          >
            <LogOut size={16} className="text-neutral-500" /> Keluar
          </button>
        </div>
      </aside>

      {/* HP: header tipis */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-neutral-950/85 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" rel="noreferrer" aria-label="Lihat website"
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white">
            <ExternalLink size={18} />
          </a>
          <button onClick={handleLogout} aria-label="Keluar"
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-red-400">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-40 pt-5 md:px-10 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* HP: bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-white/5 bg-neutral-950/90 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {flat.map((l) => (
          <TabLink key={l.to} link={l} todo={todo} />
        ))}
      </nav>
    </div>
  );
}
