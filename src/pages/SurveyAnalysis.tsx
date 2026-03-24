import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuestionChart } from "@/components/dashboard/QuestionChart";
import { FormFilter } from "@/components/dashboard/FormFilter";
import { ResponsiveChart, useChartConfig } from "@/components/dashboard/ResponsiveChart";
import { useSurveyData } from "@/hooks/useSurveyData";
import { useAuth } from "@/contexts/AuthContext";
import { questions } from "@/data/mockData";
import { cn, uniqueSectors } from "@/lib/utils";
import { PageSkeleton } from "@/components/dashboard/PageSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSearchParams } from "react-router-dom";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = ["hsl(217, 71%, 45%)", "hsl(170, 60%, 45%)", "hsl(38, 92%, 55%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)"];

export default function SurveyAnalysis() {
  const { isCompanyUser } = useAuth();
  const [activeSection, setActiveSection] = useState("contexto");
  const [searchParams, setSearchParams] = useSearchParams();
  const chart = useChartConfig();

  const selectedCompany = searchParams.get("company") || "";
  const selectedFormId = searchParams.get("form") || "";
  const sectorFilter = searchParams.get("sector") || "";

  const updateParams = (updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "") next.delete(key);
        else next.set(key, value);
      });
      return next;
    }, { replace: true });
  };

  const { isLoading, hasData, companies, respondents, getAvailableSections, getAvailableQuestions, getAnswerDistribution, getFormConfigsForCompany } = useSurveyData();

  const availableSections = getAvailableSections();
  const availableQuestions = getAvailableQuestions();
  const sectionQuestions = availableQuestions.filter((q) => q.section === activeSection);

  const effectiveCompany = isCompanyUser && companies.length === 1 ? companies[0].id : selectedCompany;

  const companyForms = effectiveCompany ? getFormConfigsForCompany(effectiveCompany) : [];

  let companyRespondents = effectiveCompany ? respondents.filter(r => r.companyId === effectiveCompany) : respondents;
  if (selectedFormId) {
    companyRespondents = companyRespondents.filter(r => (r as any).configId === selectedFormId);
  }
  const availableSectors = uniqueSectors(companyRespondents.map(r => r.sector));
  const filteredRespondents = sectorFilter
    ? companyRespondents.filter(r => r.sector.toLowerCase().trim() === sectorFilter.toLowerCase().trim())
    : companyRespondents;

  const customDistribution = (questionId: string) => {
    const pool = filteredRespondents.filter(r => r.answers[questionId] !== undefined);
    return [1, 2, 3, 4, 5].map(value => {
      const count = pool.filter(r => r.answers[questionId] === value).length;
      return { value, count, percentage: pool.length > 0 ? Math.round((count / pool.length) * 100) : 0 };
    });
  };

  const radarData = availableSections.map(s => {
    const qs = questions.filter(q => q.section === s.id);
    const qsWithData = qs.filter(q => filteredRespondents.some(r => r.answers[q.id] !== undefined));
    if (qsWithData.length === 0) return { subject: s.shortName, média: 0 };
    const avg = qsWithData.reduce((acc, q) => {
      const pool = filteredRespondents.filter(r => r.answers[q.id] !== undefined);
      return acc + (pool.length > 0 ? pool.reduce((a, r) => a + r.answers[q.id], 0) / pool.length : 0);
    }, 0) / qsWithData.length;
    return { subject: s.shortName, média: Math.round(avg * 100) / 100 };
  });

  if (isLoading) return <PageSkeleton />;
  if (!hasData) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum dado disponível.{" "}
          {!isCompanyUser && <a href="/integracoes" className="text-primary underline">Sincronize dados</a>} primeiro.
        </p>
      </div>
    </DashboardLayout>
  );

  const useCustomDist = !!(sectorFilter || selectedFormId || effectiveCompany);

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="animate-fade-in space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Análise por Pergunta</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Visualize a distribuição de respostas para cada item</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="flex flex-wrap gap-2">
              {availableSections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={cn("rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all", activeSection === s.id ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                  {s.shortName}
                </button>
              ))}
            </div>
            
            {!isCompanyUser && (
              <select
                value={selectedCompany}
                onChange={(e) => updateParams({ company: e.target.value, sector: "", form: "" })}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm w-full sm:w-auto"
              >
                <option value="">Todas as empresas</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <FormFilter 
              forms={companyForms} 
              selectedFormId={selectedFormId} 
              onChange={(id) => updateParams({ form: id, sector: "" })} 
            />

            <select 
              value={sectorFilter} 
              onChange={(e) => updateParams({ sector: e.target.value })}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm w-full sm:w-auto"
            >
              <option value="">Todos os setores</option>
              {availableSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card min-w-0">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">Radar Geral</h3>
            <ResponsiveChart height={250}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={chart.radarOuterRadius - 10}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: chart.radarAngleFontSize, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
                <Radar dataKey="média" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveChart>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sectionQuestions.map((q) => (
              <QuestionChart
                key={q.id}
                questionId={q.id}
                questionText={`${q.number}. ${q.text}`}
                companyId={effectiveCompany || undefined}
                getAnswerDistribution={useCustomDist ? customDistribution : getAnswerDistribution}
              />
            ))}
          </div>
          {sectionQuestions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma pergunta com dados nesta seção.</p>}
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
