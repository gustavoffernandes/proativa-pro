import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackofficeLayout } from "@/components/backoffice/BackofficeLayout";
import { Users, CreditCard, Building2, TrendingUp } from "lucide-react";

export default function BackofficeDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["backoffice-stats"],
    queryFn: async () => {
      const [subsRes, rolesRes, companiesRes] = await Promise.all([
        supabase.from("subscriptions").select("id, status"),
        supabase.from("user_roles").select("id, role"),
        supabase.from("google_forms_config").select("id"),
      ]);

      const subs = subsRes.data ?? [];
      const roles = rolesRes.data ?? [];
      const companies = companiesRes.data ?? [];

      return {
        totalAdmins: roles.filter((r: any) => r.role === "admin").length,
        activeSubscriptions: subs.filter((s: any) => s.status === "active").length,
        totalSubscriptions: subs.length,
        totalCompanies: companies.length,
      };
    },
  });

  const cards = [
    {
      title: "Administradores",
      value: stats?.totalAdmins ?? 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Assinantes Ativos",
      value: stats?.activeSubscriptions ?? 0,
      icon: CreditCard,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Total Assinaturas",
      value: stats?.totalSubscriptions ?? 0,
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Empresas Cadastradas",
      value: stats?.totalCompanies ?? 0,
      icon: Building2,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <BackofficeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Master</h1>
          <p className="text-sm text-slate-400 mt-1">Visão geral da plataforma PROATIVA</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{card.title}</p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold text-white">
                {isLoading ? "..." : card.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </BackofficeLayout>
  );
}
