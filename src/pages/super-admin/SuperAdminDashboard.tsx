import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, CreditCard, FileText, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: async () => {
      const [subsRes, rolesRes, companiesRes, responsesRes, syncRes] = await Promise.all([
        supabase.from("subscriptions").select("*"),
        supabase.from("user_roles").select("*"),
        supabase.from("google_forms_config").select("id, company_name, cnpj, is_active"),
        supabase.from("survey_responses").select("*", { count: "exact", head: true }),
        supabase.from("sync_logs").select("*").order("started_at", { ascending: false }).limit(10),
      ]);

      const subs = subsRes.data || [];
      const roles = rolesRes.data || [];
      const companies = companiesRes.data || [];
      const totalResponses = responsesRes.count || 0;
      const recentSyncs = syncRes.data || [];

      const activeSubs = subs.filter(s => s.status === "active");
      const adminUsers = roles.filter((r: any) => r.role === "admin");
      const uniqueCompanies = new Set(companies.map(c => c.cnpj)).size;
      const activeCompanies = companies.filter(c => c.is_active).length;

      const planBreakdown: Record<string, number> = {};
      activeSubs.forEach(s => {
        planBreakdown[s.plan_name] = (planBreakdown[s.plan_name] || 0) + 1;
      });

      return {
        totalSubscriptions: subs.length,
        activeSubscriptions: activeSubs.length,
        totalAdmins: adminUsers.length,
        totalUsers: roles.length,
        uniqueCompanies,
        activeCompanies,
        totalResponses,
        recentSyncs,
        planBreakdown,
      };
    },
  });

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  const kpis = [
    { label: "Assinaturas Ativas", value: stats?.activeSubscriptions || 0, icon: CreditCard, color: "text-primary" },
    { label: "Clientes (Admins)", value: stats?.totalAdmins || 0, icon: Users, color: "text-accent" },
    { label: "Empresas Cadastradas", value: stats?.uniqueCompanies || 0, icon: Building2, color: "text-warning" },
    { label: "Total de Respostas", value: stats?.totalResponses || 0, icon: FileText, color: "text-success" },
    { label: "Formulários Ativos", value: stats?.activeCompanies || 0, icon: TrendingUp, color: "text-primary" },
    { label: "Usuários Totais", value: stats?.totalUsers || 0, icon: Activity, color: "text-destructive" },
  ];

  return (
    <SuperAdminLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel de Controle</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da plataforma PROATIVA</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg bg-muted p-2.5", kpi.color)}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        {stats?.planBreakdown && Object.keys(stats.planBreakdown).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição por Plano</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(stats.planBreakdown).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground capitalize">{plan}</span>
                  <span className="text-lg font-bold text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent syncs */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Sincronizações Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Linhas</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentSyncs || []).map((sync: any) => (
                  <tr key={sync.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2 text-foreground">{new Date(sync.started_at).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        sync.status === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {sync.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{sync.rows_synced ?? 0}</td>
                  </tr>
                ))}
                {(!stats?.recentSyncs || stats.recentSyncs.length === 0) && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Nenhuma sincronização recente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
