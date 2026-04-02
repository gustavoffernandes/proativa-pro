import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2, Loader2, CheckCircle2, XCircle, Copy, Eye, Edit2, Download, X, Link2, Lock, Shield, FileCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface FormConfig {
  id: string;
  company_name: string;
  cnpj: string | null;
  spreadsheet_id: string;
  sheet_name: string;
  form_url: string | null;
  form_title: string | null;
  is_active: boolean;
  created_at: string;
}

function generateSurveyLink(formId: string) {
  return `${window.location.origin}/pesquisa/${formId}`;
}

export default function Forms() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_cnpj: "",
    form_title: "",
    description: "",
    instructions: "Esta pesquisa é anônima e confidencial. Suas respostas serão utilizadas para melhorar o ambiente de trabalho. Por favor, responda com sinceridade.",
    start_date: "",
    end_date: "",
    is_active: true,
    is_anonymous: true,
    require_cpf: false,
    require_consent: true,
    require_password: false,
    survey_password: "",
  });

  const { data: allConfigs = [], isLoading } = useQuery({
    queryKey: ["google-forms-config-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("google_forms_config").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FormConfig[];
    },
  });

  const configs = allConfigs.filter(c => c.spreadsheet_id !== "__placeholder__");
  const companiesMap = new Map<string, string>();
  allConfigs.forEach(c => { if (c.cnpj && !companiesMap.has(c.cnpj)) companiesMap.set(c.cnpj, c.company_name); });
  const registeredCompanies = Array.from(companiesMap.entries()).map(([cnpj, name]) => ({ cnpj, name }));

  // Count responses per config
  const { data: responseCounts = {} } = useQuery({
    queryKey: ["form-response-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("survey_responses").select("config_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => { counts[r.config_id] = (counts[r.config_id] || 0) + 1; });
      return counts;
    },
  });

  const resetForm = () => {
    setFormData({
      company_cnpj: "", form_title: "", description: "",
      instructions: "Esta pesquisa é anônima e confidencial. Suas respostas serão utilizadas para melhorar o ambiente de trabalho. Por favor, responda com sinceridade.",
      start_date: "", end_date: "", is_active: true, is_anonymous: true,
      require_cpf: false, require_consent: true, require_password: false, survey_password: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const saveForm = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.company_cnpj) throw new Error("Selecione uma empresa");
      if (!data.form_title) throw new Error("Título é obrigatório");
      const companyName = registeredCompanies.find(c => c.cnpj === data.company_cnpj)?.name || "";

      const payload: any = {
        company_name: companyName,
        cnpj: data.company_cnpj,
        form_title: data.form_title,
        spreadsheet_id: "__internal__",
        sheet_name: "internal",
        is_active: data.is_active,
      };

      if (editingId) {
        const { error } = await (supabase.from("google_forms_config") as any).update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("google_forms_config").insert([payload] as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-forms-config-all"] });
      queryClient.invalidateQueries({ queryKey: ["google-forms-config"] });
      resetForm();
      toast({ title: editingId ? "Formulário atualizado!" : "Formulário criado!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from("user_roles") as any).delete().eq("company_id", id);
      await supabase.from("survey_responses").delete().eq("config_id", id);
      const { error } = await supabase.from("google_forms_config").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-forms-config-all"] });
      queryClient.invalidateQueries({ queryKey: ["google-forms-config"] });
      queryClient.invalidateQueries({ queryKey: ["survey-responses"] });
      toast({ title: "Formulário excluído!" });
    },
  });

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(generateSurveyLink(id));
    toast({ title: "Link copiado!" });
  };

  const startEdit = (config: FormConfig) => {
    setFormData({
      company_cnpj: config.cnpj || "",
      form_title: (config as any).form_title || config.company_name,
      description: "",
      instructions: "Esta pesquisa é anônima e confidencial. Suas respostas serão utilizadas para melhorar o ambiente de trabalho. Por favor, responda com sinceridade.",
      start_date: "", end_date: "",
      is_active: config.is_active,
      is_anonymous: true, require_cpf: false, require_consent: true, require_password: false, survey_password: "",
    });
    setEditingId(config.id);
    setShowForm(true);
  };

  const getStatus = (config: FormConfig) => {
    if (!config.is_active) return { label: "Inativa", color: "text-muted-foreground", bg: "bg-muted" };
    return { label: "Ativa", color: "text-success", bg: "bg-success/10" };
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Formulários</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Crie e gerencie suas pesquisas de avaliação</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
            <Plus className="h-4 w-4" /> Novo Formulário
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-card-foreground">{editingId ? "Editar Formulário" : "Novo Formulário"}</h3>
              <button onClick={resetForm} className="p-1 rounded text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            {/* Informações do Formulário */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informações do Formulário</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Empresa *</label>
                  <select value={formData.company_cnpj} onChange={e => setFormData({ ...formData, company_cnpj: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition">
                    <option value="">Selecione uma empresa...</option>
                    {registeredCompanies.map(c => <option key={c.cnpj} value={c.cnpj}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Título do Formulário *</label>
                  <input value={formData.form_title} onChange={e => setFormData({ ...formData, form_title: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                    placeholder="Ex: Pesquisa PROART 2026 - Sede" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-foreground">Descrição</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition min-h-[60px]"
                    placeholder="Breve descrição sobre a pesquisa (opcional)" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-foreground">Instruções para os Respondentes</label>
                  <textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition min-h-[60px]" />
                </div>
              </div>
            </div>

            {/* Período */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Data de Início</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                  <p className="text-[10px] text-muted-foreground">Deixe em branco para início imediato</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Data de Término</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                  <p className="text-[10px] text-muted-foreground">Deixe em branco para não ter prazo</p>
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configurações</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <button onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                      formData.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    {formData.is_active ? "Ativa" : "Inativa"}
                  </button>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Checkbox checked={formData.is_anonymous} onCheckedChange={(v) => setFormData({ ...formData, is_anonymous: !!v })} />
                  <div><p className="text-sm font-medium text-foreground">Pesquisa Anônima</p><p className="text-xs text-muted-foreground">Respostas não serão identificadas</p></div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Checkbox checked={formData.require_cpf} onCheckedChange={(v) => setFormData({ ...formData, require_cpf: !!v })} />
                  <div><p className="text-sm font-medium text-foreground">Exigir CPF para Identificação</p><p className="text-xs text-muted-foreground">Solicita CPF antes da pesquisa para evitar respostas duplicadas. Sem CPF, a sessão é salva apenas no navegador.</p></div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Checkbox checked={formData.require_consent} onCheckedChange={(v) => setFormData({ ...formData, require_consent: !!v })} />
                  <div><p className="text-sm font-medium text-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Termo de Consentimento (LGPD)</p><p className="text-xs text-muted-foreground">Exige aceite antes de responder a pesquisa</p></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <Checkbox checked={formData.require_password} onCheckedChange={(v) => setFormData({ ...formData, require_password: !!v })} />
                    <div><p className="text-sm font-medium text-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> Proteger com Senha</p></div>
                  </div>
                  {formData.require_password && (
                    <div className="ml-10 space-y-1">
                      <label className="text-xs font-medium text-foreground">Senha da Pesquisa</label>
                      <input type="text" value={formData.survey_password} onChange={e => setFormData({ ...formData, survey_password: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                        placeholder="Digite a senha" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Link da pesquisa (only when editing) */}
            {editingId && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link da Pesquisa</h4>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{generateSurveyLink(editingId)}</span>
                  <button onClick={() => copyLink(editingId)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0">
                    <Copy className="h-3 w-3" /> Copiar Link
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => saveForm.mutate(formData)} disabled={saveForm.isPending || !formData.company_cnpj || !formData.form_title}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saveForm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />} Salvar Alterações
              </button>
              <button onClick={resetForm} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancelar</button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : configs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum formulário criado.</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Novo Formulário" para começar.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nome do Formulário</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Empresa</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Período</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Respostas</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map(config => {
                    const status = getStatus(config);
                    const count = responseCounts[config.id] || 0;
                    return (
                      <tr key={config.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{(config as any).form_title || config.company_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{config.company_name}</td>
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">{new Date(config.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="px-4 py-3 text-center font-medium text-foreground">{count}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", status.bg, status.color)}>
                            {config.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => copyLink(config.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Copiar link"><Copy className="h-3.5 w-3.5" /></button>
                            <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Ver respostas"><Eye className="h-3.5 w-3.5" /></button>
                            <button onClick={() => startEdit(config)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Gerar PDF"><Download className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { if (confirm("Excluir formulário?")) deleteForm.mutate(config.id); }}
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {configs.map(config => {
                const status = getStatus(config);
                const count = responseCounts[config.id] || 0;
                return (
                  <div key={config.id} className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-card-foreground truncate">{(config as any).form_title || config.company_name}</h3>
                        <p className="text-xs text-muted-foreground">{config.company_name}</p>
                      </div>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shrink-0", status.bg, status.color)}>
                        {config.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(config.created_at).toLocaleDateString("pt-BR")}</span>
                      <span className="font-medium text-foreground">{count} respostas</span>
                    </div>
                    <div className="flex items-center gap-1 pt-1 border-t border-border">
                      <button onClick={() => copyLink(config.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Copy className="h-3 w-3" /> Copiar</button>
                      <button onClick={() => startEdit(config)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Edit2 className="h-3 w-3" /> Editar</button>
                      <button onClick={() => { if (confirm("Excluir?")) deleteForm.mutate(config.id); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3 w-3" /> Excluir</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
