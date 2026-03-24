import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HeatmapTable } from "@/components/dashboard/HeatmapTable";
import { MultiSelectCompanies } from "@/components/dashboard/MultiSelectCompanies";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { FormFilter } from "@/components/dashboard/FormFilter";
import { useSurveyData } from "@/hooks/useSurveyData";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/dashboard/PageSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Heatmap() {
  const { isCompanyUser, userCompanyId } = useAuth();
  const [activeSection, setActiveSection] = useState("contexto");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const { isLoading, hasData, companies, respondents, formConfigs, getAvailableSections, getAvailableQuestions, getFormConfigsForCompany } = useSurveyData();
  const availableSections = getAvailableSections();

  // For company_user: only show forms for their linked company
  // For admins: forms for selected companies (or all)
  const relevantForms = isCompanyUser && userCompanyId
    ? getFormConfigsForCompany(userCompanyId)
    : selectedCompanies.length === 1
      ? formConfigs.filter(f => f.companyKey === selectedCompanies[0])
      : selectedCompanies.length === 0
        ? formConfigs
        : formConfigs.filter(f => selectedCompanies.includes(f.companyKey));

  // Auto-select company when a form is chosen
  const handleFormChange = (formId: string) => {
    setSelectedFormId(formId);
    if (formId && !isCompanyUser) {
      const form = formConfigs.find(f => f.configId === formId);
      if (form && !selectedCompanies.includes(form.companyKey)) {
        setSelectedCompanies([form.companyKey]);
      }
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (!hasData) return <DashboardLayout><div className="flex flex-col items-center justify-center h-64 text-center"><p className="text-sm text-muted-foreground">Nenhum dado disponível.</p></div></DashboardLayout>;

  // Date filter
  let filteredRespondents = respondents.filter(r => {
    if (!r.responseTimestamp) return !startDate && !endDate;
    const ts = new Date(r.responseTimestamp);
    if (startDate && ts < startDate) return false;
    if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); if (ts > end) return false; }
    return true;
  });

  // Determine display mode:
  // Mode A: specific form selected → show single column for that form
  // Mode B: company selected + "all forms" → show each form as a column
  // Mode C: no company, no form → show companies as columns (default)

  const isSingleFormSelected = !!selectedFormId;
  const companyFormsToShow = !isSingleFormSelected && selectedCompanies.length === 1
    ? formConfigs.filter(f => f.companyKey === selectedCompanies[0])
    : [];
  const showFormColumns = companyFormsToShow.length > 1;

  // Build columns and averages based on mode
  type HeatmapColumn = { id: string; name: string };

  let columns: HeatmapColumn[];
  let customGetQuestionAverage: (questionId: string, columnId?: string) => number;

  if (isSingleFormSelected) {
    // Mode A: single form — one column
    const form = formConfigs.find(f => f.configId === selectedFormId);
    const pool = filteredRespondents.filter(r => (r as any).configId === selectedFormId);
    columns = [{ id: selectedFormId, name: form?.title || "Formulário" }];
    customGetQuestionAverage = (questionId: string, columnId?: string) => {
      const withAnswer = pool.filter(r => r.answers[questionId] !== undefined);
      if (withAnswer.length === 0) return 0;
      return Math.round((withAnswer.reduce((acc, r) => acc + (r.answers[questionId] || 0), 0) / withAnswer.length) * 100) / 100;
    };
  } else if (showFormColumns) {
    // Mode B: one company, all forms → forms as columns
    columns = companyFormsToShow.map(f => ({ id: f.configId, name: f.title }));
    customGetQuestionAverage = (questionId: string, columnId?: string) => {
      let pool = filteredRespondents.filter(r => r.companyId === selectedCompanies[0]);
      if (columnId) pool = pool.filter(r => (r as any).configId === columnId);
      const withAnswer = pool.filter(r => r.answers[questionId] !== undefined);
      if (withAnswer.length === 0) return 0;
      return Math.round((withAnswer.reduce((acc, r) => acc + (r.answers[questionId] || 0), 0) / withAnswer.length) * 100) / 100;
    };
  } else {
    // Mode C: companies as columns (default)
    const effectiveCompanies = selectedCompanies.length > 0
      ? companies.filter(c => selectedCompanies.includes(c.id))
      : companies;
    columns = effectiveCompanies.map(c => ({ id: c.id, name: c.name }));
    customGetQuestionAverage = (questionId: string, columnId?: string) => {
      let pool = filteredRespondents;
      if (columnId) pool = pool.filter(r => r.companyId === columnId);
      else if (selectedCompanies.length > 0) pool = pool.filter(r => selectedCompanies.includes(r.companyId));
      const withAnswer = pool.filter(r => r.answers[questionId] !== undefined);
      if (withAnswer.length === 0) return 0;
      return Math.round((withAnswer.reduce((acc, r) => acc + (r.answers[questionId] || 0), 0) / withAnswer.length) * 100) / 100;
    };
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="animate-fade-in space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Heatmap de Satisfação</h1>
            <p className="text-sm text-muted-foreground mt-1">Mapa de calor comparativo entre empresas</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {availableSections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-all", activeSection === s.id ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                  {s.shortName}
                </button>
              ))}
            </div>
            {!isCompanyUser && <MultiSelectCompanies companies={companies} selected={selectedCompanies} onChange={(ids) => { setSelectedCompanies(ids); setSelectedFormId(""); }} />}
            <FormFilter forms={relevantForms} selectedFormId={selectedFormId} onChange={handleFormChange} />
            <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
          </div>
          <HeatmapTable
            sectionId={activeSection}
            columns={columns}
            getQuestionAverage={customGetQuestionAverage}
            getAvailableQuestions={getAvailableQuestions}
            isNegativeSection={activeSection === "vivencias" || activeSection === "saude"}
          />
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
