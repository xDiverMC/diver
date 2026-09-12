// src/layouts/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Newspaper, Users, ShoppingBag, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "../lib/supabase";

const links = [
  { to: "/admin/news", label: "News", icon: Newspaper },
  { to: "/admin/staff", label: "Staff", icon: Users },
  { to: "/admin/store", label: "Store", icon: ShoppingBag },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row">
      <aside className="md:w-60 w-full border-b md:border-b-0 md:border-r border-neutral-800 md:min-h-screen md:sticky md:top-0 md:h-screen flex flex-col">
        <div className="px-5 py-5 border-b border-neutral-800 hidden md:block">
          <div className="font-bold text-lg text-white">Admin Panel</div>
          <div className="text-xs text-neutral-500 mt-0.5">RealmCraft</div>
        </div>

        <nav className="flex md:flex-col gap-1 flex-1 overflow-x-auto p-3">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  }`
                }
              >
                <Icon size={17} />
                {l.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-800 flex md:flex-col gap-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white whitespace-nowrap"
          >
            <ExternalLink size={17} />
            Lihat Website
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/50 whitespace-nowrap"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden max-w-full">
        <div className="max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
