import { useState } from "react";
import { ProativaSidebar } from "./ProativaSidebar";
import { ProativaTopbar } from "./ProativaTopbar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role } = useAuth();
  useOnboarding(user?.id, role);

  return (
    <div className="flex min-h-screen">
      <ProativaSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300 min-w-0",
        "md:ml-[260px]",
        collapsed && "md:ml-[72px]"
      )}>
        <ProativaTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
