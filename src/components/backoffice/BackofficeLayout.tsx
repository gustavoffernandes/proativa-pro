import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", path: "/backoffice", icon: LayoutDashboard },
  { title: "Contas", path: "/backoffice/contas", icon: Users },
  { title: "Assinaturas", path: "/backoffice/assinaturas", icon: CreditCard },
  { title: "Configurações", path: "/backoffice/configuracoes", icon: Settings },
];

interface BackofficeLayoutProps {
  children: React.ReactNode;
}

export function BackofficeLayout({ children }: BackofficeLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500">
            <Shield className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">PROATIVA</h1>
            <p className="text-[11px] text-amber-400 font-medium">BACKOFFICE</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col md:ml-64 min-w-0">
        <header className="sticky top-0 z-30 flex items-center h-14 px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
          <button
            className="md:hidden mr-3 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm text-slate-500 font-medium">Painel Master</span>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
