import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, CreditCard, ScrollText,
  LogOut, ChevronLeft, ChevronRight, X, BarChart3, Menu
} from "lucide-react";

const menuItems = [
  { path: "/super-admin", label: "Painel Geral", icon: LayoutDashboard },
  { path: "/super-admin/contas", label: "Gestão de Contas", icon: Users },
  { path: "/super-admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { path: "/super-admin/logs", label: "Logs de Auditoria", icon: ScrollText },
];

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        "max-md:-translate-x-full max-md:w-[260px]",
        mobileOpen && "max-md:translate-x-0",
        "md:z-40",
        collapsed ? "md:w-[72px]" : "md:w-[260px]"
      )}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive">
              <BarChart3 className="h-5 w-5 text-destructive-foreground" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="animate-fade-in">
                <h1 className="text-sm font-bold text-sidebar-primary-foreground">SUPER ADMIN</h1>
                <p className="text-[10px] text-sidebar-foreground opacity-60">Painel de Controle</p>
              </div>
            )}
          </div>
          <button className="md:hidden rounded-lg p-1 text-sidebar-foreground hover:bg-sidebar-accent transition-colors" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className={cn("mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40", collapsed && !mobileOpen && "hidden")}>
            Administração
          </p>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} end onClick={() => setMobileOpen(false)}
                className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                {isActive && <div className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-ring" />}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {(!collapsed || mobileOpen) && <span className="animate-fade-in">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
          {(!collapsed || mobileOpen) && user && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-sidebar-foreground/50">Super Administrador</p>
            </div>
          )}
          <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {(!collapsed || mobileOpen) && <span>Sair</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            {collapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300 min-w-0",
        "md:ml-[260px]",
        collapsed && "md:ml-[72px]"
      )}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm md:px-6">
          <button className="md:hidden rounded-lg p-2 text-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">Painel Super Admin</h2>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
