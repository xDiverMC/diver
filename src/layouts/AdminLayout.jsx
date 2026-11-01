// src/layouts/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ExternalLink, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";

const links = [
  { to: "/admin/news", label: "News" },
  { to: "/admin/staff", label: "Staff" },
  { to: "/admin/store", label: "Store" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/coupons", label: "Kupon" },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row">
      <aside className="md:w-56 w-full border-b md:border-b-0 md:border-r border-neutral-800 p-4 flex md:flex-col gap-2">
        <div className="mb-2 hidden md:block">
          <div className="font-bold text-lg">Admin Panel</div>
          <div className="text-xs text-neutral-500">RealmCraft</div>
        </div>
        <nav className="flex md:flex-col gap-2 flex-1 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm whitespace-nowrap ${
                  isActive ? "bg-emerald-600 text-white" : "text-neutral-400 hover:bg-neutral-800"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <a href="/" target="_blank" rel="noreferrer"
          className="px-3 py-2 rounded text-sm text-neutral-400 hover:bg-neutral-800 whitespace-nowrap flex items-center gap-1.5">
          <ExternalLink size={14} /> Lihat Website
        </a>
        <button onClick={handleLogout}
          className="px-3 py-2 rounded text-sm text-red-400 hover:bg-neutral-800 whitespace-nowrap flex items-center gap-1.5">
          <LogOut size={14} /> Logout
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
