// src/layouts/AdminLayout.jsx — sidebar (desktop) + menu bawah (HP) bertema terang.
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Package,
  Settings,
  ShoppingBag,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { adminFetch } from "../lib/adminApi";
import "../styles/admin.css";

const SECTIONS = [
  {
    title: "Toko",
    links: [
      { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard, primary: true },
      { to: "/admin/orders", label: "Pesanan", icon: Package, badge: true, primary: true },
      { to: "/admin/store", label: "Produk", icon: ShoppingBag, primary: true },
      { to: "/admin/coupons", label: "Kupon", icon: Ticket },
    ],
  },
  {
    title: "Konten",
    links: [
      { to: "/admin/news", label: "Berita", icon: Newspaper, primary: true },
      { to: "/admin/staff", label: "Staff", icon: Users },
    ],
  },
  {
    title: "Sistem",
    links: [
      { to: "/admin/logs", label: "Log", icon: ClipboardList },
      { to: "/admin/settings", label: "Pengaturan", icon: Settings },
    ],
  },
];

const ALL = SECTIONS.flatMap((s) => s.links);
const PRIMARY = ALL.filter((l) => l.primary);
const MORE = ALL.filter((l) => !l.primary);

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold"
        style={{ background: "linear-gradient(135deg,#34d399,#059669)", color: "#fff" }}
      >
        S
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">SiestaNet</div>
        <div className="text-[11px] text-neutral-500">Admin</div>
      </div>
    </div>
  );
}

function SideLink({ link, todo, onClick }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onClick}
      className={({ isActive }) => `side-link ${isActive ? "on" : ""}`}
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className={isActive ? "text-emerald-400" : "text-neutral-500"} />
          <span className="flex-1">{link.label}</span>
          {link.badge && todo > 0 && <span className="badge-count">{todo}</span>}
        </>
      )}
    </NavLink>
  );
}

function TabLink({ link, todo }) {
  const Icon = link.icon;
  return (
    <NavLink to={link.to} end={link.end} className={({ isActive }) => `tab-link ${isActive ? "on" : ""}`}>
      <span className="relative">
        <Icon size={20} />
        {link.badge && todo > 0 && <span className="badge-count absolute -right-3 -top-2">{todo}</span>}
      </span>
      {link.label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [todo, setTodo] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  // Badge merah di menu Pesanan = pesanan dibayar yang belum terkirim.
  // Dibaca lewat server, jadi tidak tergantung izin tabel di Supabase.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const { todo: n } = await adminFetch("summary");
        if (!cancelled) setTodo(n ?? 0);
      } catch {
        // abaikan; halaman Pesanan menampilkan errornya sendiri
      }
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

  const moreActive = MORE.some((l) => location.pathname.startsWith(l.to));

  return (
    <div className="admin-root min-h-screen bg-neutral-950 text-neutral-100 md:flex">
      {/* Desktop: sidebar */}
      <aside className="hidden border-r border-white/10 bg-neutral-900 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:px-3 md:py-5">
        <div className="mb-7 px-2">
          <Logo />
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
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

        <div className="flex flex-col gap-0.5 border-t border-white/10 pt-3">
          <a href="/" target="_blank" rel="noreferrer" className="side-link">
            <ExternalLink size={17} className="text-neutral-500" /> Lihat website
          </a>
          <button onClick={handleLogout} className="side-link logout">
            <LogOut size={17} className="text-neutral-500" /> Keluar
          </button>
        </div>
      </aside>

      {/* HP: header tipis */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-neutral-900/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <a href="/" target="_blank" rel="noreferrer" aria-label="Lihat website" className="icon-btn">
          <ExternalLink size={18} />
        </a>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-40 pt-5 md:px-10 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* HP: menu bawah (4 menu utama + "Lainnya") */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-neutral-900/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {PRIMARY.map((l) => (
          <TabLink key={l.to} link={l} todo={todo} />
        ))}
        <button type="button" onClick={() => setMoreOpen(true)} className={`tab-link ${moreActive ? "on" : ""}`}>
          <Menu size={20} />
          Lainnya
        </button>
      </nav>

      {/* HP: lembar menu "Lainnya" */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Tutup"
            className="absolute inset-0"
            style={{ background: "rgb(0 0 0 / 0.35)" }}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-white/10 bg-neutral-900 p-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-white">Menu lainnya</span>
              <button type="button" className="icon-btn" aria-label="Tutup" onClick={() => setMoreOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {MORE.map((l) => (
                <SideLink key={l.to} link={l} todo={todo} onClick={() => setMoreOpen(false)} />
              ))}
              <a href="/" target="_blank" rel="noreferrer" className="side-link">
                <ExternalLink size={17} className="text-neutral-500" /> Lihat website
              </a>
              <button onClick={handleLogout} className="side-link logout">
                <LogOut size={17} className="text-neutral-500" /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
