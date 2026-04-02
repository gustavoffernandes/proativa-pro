import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSurveyData } from "@/hooks/useSurveyData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Crown, Building2, FileText, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanDef {
  name: string;
  description: string;
  highlight?: boolean;
  limits: {
    companies: number;
    surveys: number;
    respondents: number;
    users: number;
  };
  features: {
    pdfReport: boolean;
    excelExport: boolean;
    riskMatrix: boolean;
    sectorFilters: boolean;
    support: boolean;
  };
}

const plans: PlanDef[] = [
  {
    name: "Starter",
    description: "Pequenas empresas e consultores independentes.",
    limits: { companies: 1, surveys: 1, respondents: 20, users: 1 },
    features: { pdfReport: true, excelExport: true, riskMatrix: false, sectorFilters: false, support: false },
  },
  {
    name: "Profissional",
    description: "Empresas e consultorias SST em crescimento.",
    highlight: true,
    limits: { companies: 10, surveys: 10, respondents: 200, users: 2 },
    features: { pdfReport: true, excelExport: true, riskMatrix: true, sectorFilters: true, support: false },
  },
  {
    name: "Empresarial",
    description: "Grandes operações, redes e consultorias.",
    limits: { companies: 25, surveys: 50, respondents: 500, users: 5 },
    features: { pdfReport: true, excelExport: true, riskMatrix: true, sectorFilters: true, support: true },
  },
];

const featureLabels: { key: keyof PlanDef["features"]; label: string }[] = [
  { key: "pdfReport", label: "Relatório PDF" },
  { key: "excelExport", label: "Exportação Excel" },
  { key: "riskMatrix", label: "Matriz de Risco P×S" },
  { key: "sectorFilters", label: "Filtro por GHE/Setor" },
  { key: "support", label: "Suporte prioritário" },
];

export default function Subscription() {
  const { companies, formConfigs } = useSurveyData();

  const { data: responseCount = 0 } = useQuery({
    queryKey: ["total-response-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("survey_responses").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // TODO: get actual plan from subscription system
  const currentPlan = plans[1]; // Profissional as default
  const companiesCount = companies.length;
  const surveysCount = formConfigs?.length || 0;

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Minha Assinatura</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gerencie seu plano e visualize o uso da plataforma</p>
        </div>

        {/* Current Plan */}
        <div className="rounded-xl border-2 border-primary bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Plano {currentPlan.name}</h3>
          </div>

          {/* Usage metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Empresas Cadastradas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{companiesCount}<span className="text-sm text-muted-foreground">/{currentPlan.limits.companies}</span></p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Pesquisas Criadas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{surveysCount}<span className="text-sm text-muted-foreground">/{currentPlan.limits.surveys}</span></p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Respondentes</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{responseCount}<span className="text-sm text-muted-foreground">/{currentPlan.limits.respondents}</span></p>
            </div>
          </div>

          {/* Plan features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Recursos do Seu Plano</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {featureLabels.map(f => (
                <div key={f.key} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm text-foreground">{f.label}</span>
                  {currentPlan.features[f.key] ? (
                    <span className="flex items-center gap-1 text-xs text-success font-semibold"><Check className="h-3.5 w-3.5" /> Incluído</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold"><X className="h-3.5 w-3.5" /> Não incluído</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Period info */}
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs text-muted-foreground">Seu plano é renovado mensalmente. Para alterar o plano, clique no botão abaixo.</p>
          </div>
        </div>

        {/* Plans comparison */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Planos Disponíveis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(plan => {
              const isCurrent = plan.name === currentPlan.name;
              return (
                <div key={plan.name} className={cn("rounded-xl border-2 bg-card p-5 shadow-card transition-all",
                  isCurrent ? "border-primary" : "border-border", plan.highlight && !isCurrent && "border-primary/30")}>
                  <div className="text-center mb-4">
                    {isCurrent && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2"><Crown className="h-3 w-3" /> PLANO ATUAL</span>}
                    <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span>{plan.limits.companies} empresa(s)</span></div>
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span>{plan.limits.surveys} pesquisa(s)/mês</span></div>
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span>{plan.limits.respondents} respondentes</span></div>
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span>{plan.limits.users} usuário(s)</span></div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {featureLabels.map(f => (
                      <div key={f.key} className="flex items-center gap-2 text-sm">
                        {plan.features[f.key] ? (
                          <><Check className="h-3.5 w-3.5 text-success" /><span className="text-foreground">{f.label}</span></>
                        ) : (
                          <><X className="h-3.5 w-3.5 text-muted-foreground/50" /><span className="text-muted-foreground line-through">{f.label}</span></>
                        )}
                      </div>
                    ))}
                  </div>

                  <button disabled={isCurrent}
                    className={cn("w-full rounded-lg py-2 text-sm font-medium transition-colors",
                      isCurrent ? "bg-muted text-muted-foreground cursor-default" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
                    {isCurrent ? "Plano Atual" : "Selecionar Plano"}
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
