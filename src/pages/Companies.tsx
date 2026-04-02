import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Trash2, Loader2, Edit2, Check, X, MapPin, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CompanyEntry {
  cnpj: string;
  company_name: string;
  sector: string;
  employee_count: number | null;
  form_count: number;
}

interface CompanySector {
  name: string;
  code: string;
  description: string;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Companies() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "", cnpj: "", sector: "", employee_count: "",
    contact_name: "", contact_email: "", contact_phone: "",
    address_street: "", address_city: "", address_state: "", address_zip: "",
  });
  const [editingCnpj, setEditingCnpj] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", sector: "", employee_count: "" });

  // Sectors management
  const [companySectors, setCompanySectors] = useState<Record<string, CompanySector[]>>({});
  const [newSector, setNewSector] = useState<CompanySector>({ name: "", code: "", description: "" });
  const [addingSectorFor, setAddingSectorFor] = useState<string | null>(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["google-forms-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("google_forms_config").select("*").order("company_name");
      if (error) throw error;
      return data || [];
    },
  });

  const companies: CompanyEntry[] = [];
  const cnpjMap = new Map<string, { name: string; sector: string; employee_count: number | null; count: number; priority: 0 | 1 }>();

  configs.forEach((c: any) => {
    const cnpj = c.cnpj || "";
    if (!cnpj) return;
    const isPlaceholder = c.spreadsheet_id === "__placeholder__";
    const priority: 0 | 1 = isPlaceholder ? 0 : 1;
    if (cnpjMap.has(cnpj)) {
      const current = cnpjMap.get(cnpj)!;
      if (!isPlaceholder) current.count++;
      if (priority > current.priority) {
        current.name = c.company_name || current.name;
        current.sector = c.sector || current.sector;
        current.employee_count = c.employee_count || current.employee_count;
        current.priority = priority;
      }
    } else {
      cnpjMap.set(cnpj, { name: c.company_name, sector: c.sector || "", employee_count: c.employee_count || null, count: isPlaceholder ? 0 : 1, priority });
    }
  });
  cnpjMap.forEach((val, cnpj) => {
    companies.push({ cnpj, company_name: val.name, sector: val.sector, employee_count: val.employee_count, form_count: val.count });
  });

  const addCompany = useMutation({
    mutationFn: async (data: typeof formData) => {
      const cnpjDigits = cleanCNPJ(data.cnpj);
      if (cnpjDigits.length !== 14) throw new Error("CNPJ deve ter 14 dígitos");
      const existing = configs.find((c: any) => c.cnpj === cnpjDigits);
      if (existing) throw new Error("Já existe uma empresa cadastrada com este CNPJ");
      const { error } = await supabase.from("google_forms_config").insert([{
        company_name: data.company_name, cnpj: cnpjDigits,
        spreadsheet_id: "__placeholder__", sheet_name: "Form Responses 1", is_active: false,
        sector: data.sector || null, employee_count: data.employee_count ? parseInt(data.employee_count) : null,
      }] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-forms-config"] });
      queryClient.invalidateQueries({ queryKey: ["google-forms-config-all"] });
      setShowForm(false);
      setFormData({ company_name: "", cnpj: "", sector: "", employee_count: "", contact_name: "", contact_email: "", contact_phone: "", address_street: "", address_city: "", address_state: "", address_zip: "" });
      toast({ title: "Empresa cadastrada com sucesso!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateCompany = useMutation({
    mutationFn: async ({ cnpj, newName, sector, employee_count }: { cnpj: string; newName: string; sector: string; employee_count: string }) => {
      const normalizedName = newName.trim();
      if (!normalizedName) throw new Error("Nome da empresa é obrigatório");
      const parsedEmployeeCount = employee_count ? Number(employee_count) : null;
      const updateData: any = { company_name: normalizedName, sector: sector?.trim() || null, employee_count: parsedEmployeeCount };
      const { error } = await (supabase.from("google_forms_config") as any).update(updateData).eq("cnpj", cnpj);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-forms-config"] });
      queryClient.invalidateQueries({ queryKey: ["google-forms-config-all"] });
      setEditingCnpj(null);
      toast({ title: "Empresa atualizada!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteCompany = useMutation({
    mutationFn: async (cnpj: string) => {
      const configIds = configs.filter((c: any) => c.cnpj === cnpj).map((c: any) => c.id);
      for (const configId of configIds) {
        await (supabase.from("user_roles") as any).delete().eq("company_id", configId);
        await supabase.from("survey_responses").delete().eq("config_id", configId);
      }
      const { error } = await (supabase.from("google_forms_config") as any).delete().eq("cnpj", cnpj);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-forms-config"] });
      queryClient.invalidateQueries({ queryKey: ["google-forms-config-all"] });
      queryClient.invalidateQueries({ queryKey: ["survey-responses"] });
      toast({ title: "Empresa removida!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const addSector = (cnpj: string) => {
    if (!newSector.name) return;
    setCompanySectors(prev => ({
      ...prev,
      [cnpj]: [...(prev[cnpj] || []), { ...newSector }],
    }));
    setNewSector({ name: "", code: "", description: "" });
    toast({ title: "Setor adicionado!" });
  };

  const removeSector = (cnpj: string, index: number) => {
    setCompanySectors(prev => ({
      ...prev,
      [cnpj]: (prev[cnpj] || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Empresas</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Cadastre e gerencie as empresas mentoradas</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
            <Plus className="h-4 w-4" /> Nova Empresa
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-6">
            <h3 className="text-sm font-semibold text-card-foreground">Cadastrar Empresa</h3>

            {/* Dados básicos */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Básicos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Nome Fantasia *</label>
                  <input value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Ex: TechSol Ltda" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">CNPJ *</label>
                  <input value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="00.000.000/0000-00" maxLength={18} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Setor de Atuação</label>
                  <input value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Ex: Tecnologia, Indústria" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Nº de Funcionários</label>
                  <input type="number" value={formData.employee_count} onChange={e => setFormData({ ...formData, employee_count: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Ex: 50" min="1" />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> Contato</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Nome do Responsável</label>
                  <input value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Ex: João Silva" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">E-mail</label>
                  <input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="contato@empresa.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Telefone</label>
                  <input value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: formatPhone(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="(00) 00000-0000" maxLength={15} />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereço</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-foreground">Logradouro</label>
                  <input value={formData.address_street} onChange={e => setFormData({ ...formData, address_street: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Rua, número, complemento" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Cidade</label>
                  <input value={formData.address_city} onChange={e => setFormData({ ...formData, address_city: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Ex: São Paulo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">UF</label>
                    <input value={formData.address_state} onChange={e => setFormData({ ...formData, address_state: e.target.value.toUpperCase().slice(0, 2) })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="SP" maxLength={2} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">CEP</label>
                    <input value={formData.address_zip} onChange={e => setFormData({ ...formData, address_zip: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="00000-000" maxLength={9} />
                  </div>
                </div>
              </div>
            </div>

            {/* Setores */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Setores da Empresa</h4>
              <p className="text-xs text-muted-foreground">Adicione os setores que aparecerão no formulário de pesquisa.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Nome *</label>
                  <input value={newSector.name} onChange={e => setNewSector({ ...newSector, name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Ex: Produção, RH" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Código</label>
                  <input value={newSector.code} onChange={e => setNewSector({ ...newSector, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Ex: PROD, RH" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Descrição</label>
                  <div className="flex gap-2">
                    <input value={newSector.description} onChange={e => setNewSector({ ...newSector, description: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" placeholder="Opcional" />
                    <button onClick={() => addSector("new")} disabled={!newSector.name}
                      className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              {(companySectors["new"] || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {companySectors["new"].map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                      {s.code ? `${s.code} - ` : ""}{s.name}
                      <button onClick={() => removeSector("new", i)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => addCompany.mutate(formData)}
                disabled={addCompany.isPending || !formData.company_name || cleanCNPJ(formData.cnpj).length !== 14}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {addCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Salvar
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancelar</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : companies.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada.</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Empresa" para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map(company => (
              <div key={company.cnpj} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {editingCnpj === company.cnpj ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Nome Fantasia</label>
                            <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })}
                              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" autoFocus />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Setor</label>
                            <input value={editData.sector} onChange={e => setEditData({ ...editData, sector: e.target.value })}
                              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Nº de Funcionários</label>
                            <input type="number" value={editData.employee_count} onChange={e => setEditData({ ...editData, employee_count: e.target.value })}
                              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" min="1" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateCompany.mutate({ cnpj: company.cnpj, newName: editData.name, sector: editData.sector, employee_count: editData.employee_count })}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                            <Check className="h-3 w-3" /> Salvar
                          </button>
                          <button onClick={() => setEditingCnpj(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                            <X className="h-3 w-3" /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-card-foreground">{company.company_name}</h3>
                          <button onClick={() => { setEditingCnpj(company.cnpj); setEditData({ name: company.company_name, sector: company.sector || "", employee_count: company.employee_count ? String(company.employee_count) : "" }); }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">CNPJ: {formatCNPJ(company.cnpj)}</p>
                        {company.sector && <p className="text-xs text-muted-foreground">Setor: {company.sector}</p>}
                        {company.employee_count && <p className="text-xs text-muted-foreground">Funcionários: {company.employee_count}</p>}
                        <p className="text-xs text-muted-foreground">{company.form_count} formulário(s) vinculado(s)</p>

                        {/* Sectors */}
                        {(companySectors[company.cnpj] || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {companySectors[company.cnpj].map((s, i) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
                                {s.code ? `${s.code} - ` : ""}{s.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Add sector inline */}
                        {addingSectorFor === company.cnpj ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input value={newSector.name} onChange={e => setNewSector({ ...newSector, name: e.target.value })}
                              className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nome do setor" />
                            <input value={newSector.code} onChange={e => setNewSector({ ...newSector, code: e.target.value.toUpperCase() })}
                              className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Código" />
                            <button onClick={() => { addSector(company.cnpj); }} disabled={!newSector.name}
                              className="rounded p-1 text-success hover:bg-success/10 disabled:opacity-50"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setAddingSectorFor(null)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setAddingSectorFor(company.cnpj)}
                            className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Adicionar setor
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {editingCnpj !== company.cnpj && (
                    <button onClick={() => { if (confirm(`Remover empresa "${company.company_name}" e todos os formulários vinculados?`)) deleteCompany.mutate(company.cnpj); }}
                      className="rounded-lg border border-destructive/30 p-2 text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
