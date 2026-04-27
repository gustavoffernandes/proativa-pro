import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSurveyData } from "@/hooks/useSurveyData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Crown, Building2, FileText, Users, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlans, useCurrentUserPlan, type Plan, type PlanFeatures } from "@/hooks/usePlans";

const featureLabels: { key: keyof PlanFeatures; label: string }[] = [
  { key: "relatorio_pdf", label: "Relatório PDF" },
  { key: "exportacao_excel", label: "Exportação Excel" },
  { key: "matriz_risco", label: "Matriz de Risco P×S" },
  { key: "filtro_ghe", label: "Filtro por GHE/Setor" },
  { key: "suporte_prioritario", label: "Suporte prioritário" },
];

export default function Subscription() {
  const { companies, formConfigs } = useSurveyData();
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: currentPlan, isLoading: currentLoading } = useCurrentUserPlan();

  const { data: responseCount = 0 } = useQuery({
    queryKey: ["total-response-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("survey_responses").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: usersCount = 0 } = useQuery({
    queryKey: ["family-users-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("user_roles").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const companiesCount = companies.length;
  const surveysCount = formConfigs?.length || 0;

  if (plansLoading || currentLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Minha Assinatura</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gerencie seu plano e visualize o uso da plataforma</p>
        </div>

        {/* Current Plan */}
        {currentPlan ? (
          <div className="rounded-xl border-2 border-primary bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Plano {currentPlan.name}</h3>
            </div>

            {/* Usage metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Empresas Cadastradas</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{companiesCount}<span className="text-sm text-muted-foreground">/{currentPlan.max_companies}</span></p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Pesquisas/mês</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{surveysCount}<span className="text-sm text-muted-foreground">/{currentPlan.max_surveys_per_month}</span></p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Respondentes</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{responseCount}<span className="text-sm text-muted-foreground">/{currentPlan.max_respondents}</span></p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Usuários Cadastrados</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{usersCount}<span className="text-sm text-muted-foreground">/{currentPlan.max_users}</span></p>
              </div>
            </div>

            {/* Plan features */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Recursos do Seu Plano</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {featureLabels.map(f => {
                  const enabled = !!currentPlan.features?.[f.key];
                  return (
                    <div key={String(f.key)} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-sm text-foreground">{f.label}</span>
                      {enabled ? (
                        <span className="flex items-center gap-1 text-xs text-success font-semibold"><Check className="h-3.5 w-3.5" /> Incluído</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold"><X className="h-3.5 w-3.5" /> Não incluído</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-muted-foreground">Para alterar seu plano, entre em contato com o administrador da conta.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border bg-card p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Nenhum plano vinculado</p>
            <p className="text-xs text-muted-foreground mt-1">Sua conta ainda não possui um plano ativo. Solicite ao administrador.</p>
          </div>
        )}

        {/* Plans comparison */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Planos Disponíveis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan: Plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              return (
                <div key={plan.id} className={cn("rounded-xl border-2 bg-card p-5 shadow-card transition-all",
                  isCurrent ? "border-primary" : "border-border")}>
                  <div className="text-center mb-4">
                    {isCurrent && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2"><Crown className="h-3 w-3" /> PLANO ATUAL</span>}
                    <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                    {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span>{plan.max_companies} empresa(s)</span></div>
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span>{plan.max_surveys_per_month} pesquisa(s)/mês</span></div>
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span>{plan.max_respondents} respondentes</span></div>
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span>{plan.max_users} usuário(s)</span></div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {featureLabels.map(f => {
                      const enabled = !!plan.features?.[f.key];
                      return (
                        <div key={String(f.key)} className="flex items-center gap-2 text-sm">
                          {enabled ? (
                            <><Check className="h-3.5 w-3.5 text-success" /><span className="text-foreground">{f.label}</span></>
                          ) : (
                            <><X className="h-3.5 w-3.5 text-muted-foreground/50" /><span className="text-muted-foreground line-through">{f.label}</span></>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button disabled className={cn("w-full rounded-lg py-2 text-sm font-medium",
                    isCurrent ? "bg-muted text-muted-foreground cursor-default" : "bg-muted/50 text-muted-foreground cursor-not-allowed")}>
                    {isCurrent ? "Plano Atual" : "Solicitar Upgrade"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
