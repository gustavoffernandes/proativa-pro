import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSurveyData } from "@/hooks/useSurveyData";
import { Loader2, Users, CheckCircle2, Clock, AlertCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function Respondents() {
  const { isLoading, hasData, companies, respondents, formConfigs } = useSurveyData();
  const [filterForm, setFilterForm] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSector, setFilterSector] = useState("");

  const filtered = useMemo(() => {
    return respondents.filter(r => {
      if (filterForm && r.configId !== filterForm) return false;
      if (filterCompany && r.companyId !== filterCompany) return false;
      return true;
    });
  }, [respondents, filterForm, filterCompany, filterStatus, filterSector]);

  const totalRecords = filtered.length;
  const completed = filtered.length; // all survey_responses are completed
  const inProgress = 0;
  const pending = 0;
  const completionRate = totalRecords > 0 ? Math.round((completed / totalRecords) * 100) : 0;

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Respondentes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Visualize quem respondeu, quem está em andamento e quem ainda não iniciou</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Total de Registros</p>
            <p className="text-2xl font-bold text-foreground">{totalRecords}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Concluídos</p>
            <p className="text-2xl font-bold text-success">{completed}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Em Andamento</p>
            <p className="text-2xl font-bold text-warning">{inProgress}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-muted-foreground">{pending}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Taxa de Conclusão</p>
            <p className="text-2xl font-bold text-primary">{completionRate}%</p>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Progresso geral</p>
            <p className="text-sm text-muted-foreground">{completed}/{totalRecords} concluídos</p>
          </div>
          <Progress value={completionRate} className="h-3" />
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Concluído</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> Em andamento</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /> Pendente</span>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={filterForm} onChange={e => setFilterForm(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Todos os formulários</option>
              {formConfigs?.map(f => <option key={f.configId} value={f.configId}>{f.title}</option>)}
            </select>
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Todas as empresas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Todos os status</option>
              <option value="completed">Concluído</option>
              <option value="in_progress">Em andamento</option>
              <option value="pending">Pendente</option>
            </select>
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Todos os setores</option>
            </select>
          </div>
        </div>

        {/* Detail Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">Detalhamento ({filtered.length} registros)</h3>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum respondente encontrado.</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Colaborador</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Empresa</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Setor</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pesquisa</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map((r, i) => {
                      const company = companies.find(c => c.id === r.companyId);
                      const form = formConfigs?.find(f => f.configId === r.configId);
                      return (
                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-foreground">{r.respondentName || "Anônimo"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{company?.name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.sector || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{form?.title || "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-semibold">
                              <CheckCircle2 className="h-3 w-3" /> Concluído
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                            {r.responseTimestamp ? new Date(r.responseTimestamp).toLocaleDateString("pt-BR") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-border">
                {filtered.slice(0, 50).map((r, i) => {
                  const company = companies.find(c => c.id === r.companyId);
                  const form = formConfigs?.find(f => f.configId === r.configId);
                  return (
                    <div key={i} className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{r.respondentName || "Anônimo"}</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-[10px] font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Concluído
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{company?.name} · {form?.title || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.responseTimestamp ? new Date(r.responseTimestamp).toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
