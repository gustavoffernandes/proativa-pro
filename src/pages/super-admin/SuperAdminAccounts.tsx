import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Loader2, Pencil, Trash2, Check, X, Shield, User, Building2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  user: "Usuário",
  company_user: "Usuário Empresa",
  super_admin: "Super Admin",
};

export default function SuperAdminAccounts() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<string>("admin");
  const [newCompanyId, setNewCompanyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["super-admin-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify({ action: "list" }),
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw error;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const emailMap: Record<string, string> = {};
      if (parsed?.users) parsed.users.forEach((u: any) => { emailMap[u.id] = u.email; });
      return (parsed?.roles || []).map((r: any) => ({ ...r, email: emailMap[r.user_id] || "" }));
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["super-admin-companies"],
    queryFn: async () => {
      const { data } = await supabase.from("google_forms_config").select("id, company_name").order("company_name");
      return data || [];
    },
  });

  const filtered = accounts.filter((a: any) =>
    !search || a.email?.toLowerCase().includes(search.toLowerCase()) || (ROLE_LABEL[a.role] || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newEmail || !newPassword) { toast({ title: "Preencha e-mail e senha", variant: "destructive" }); return; }
    if (newPassword.length < 8) { toast({ title: "Senha mínima: 8 caracteres", variant: "destructive" }); return; }
    if (newRole === "company_user" && !newCompanyId) { toast({ title: "Selecione uma empresa", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const body: any = { email: newEmail, password: newPassword, role: newRole };
      if (newRole === "company_user") body.company_id = newCompanyId;
      const { error } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw error;
      toast({ title: "Conta criada com sucesso!" });
      setNewEmail(""); setNewPassword(""); setNewRole("admin"); setNewCompanyId(""); setShowCreate(false);
      qc.invalidateQueries({ queryKey: ["super-admin-accounts"] });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    setCreating(false);
  };

  const handleUpdate = async (roleId: string) => {
    try {
      const { error } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify({ action: "update", role_id: roleId, role: editRole }),
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw error;
      toast({ title: "Conta atualizada!" });
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["super-admin-accounts"] });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (roleId: string, userId: string) => {
    if (!confirm("Excluir esta conta permanentemente?")) return;
    try {
      const { error } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify({ action: "delete", user_id: userId, role_id: roleId }),
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw error;
      toast({ title: "Conta removida!" });
      qc.invalidateQueries({ queryKey: ["super-admin-accounts"] });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  return (
    <SuperAdminLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestão de Contas</h1>
            <p className="text-sm text-muted-foreground mt-1">Crie e gerencie contas de clientes administradores</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <UserPlus className="h-4 w-4" /> Nova Conta
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground">Criar Nova Conta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">E-mail</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@empresa.com"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Senha</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Tipo</label>
                <select value={newRole} onChange={e => { setNewRole(e.target.value); setNewCompanyId(""); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="admin">Administrador (Cliente)</option>
                  <option value="user">Usuário Geral</option>
                  <option value="company_user">Usuário Empresa</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {newRole === "company_user" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Empresa</label>
                  <select value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="">Selecione...</option>
                    {companies.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Criar
              </button>
              <button onClick={() => setShowCreate(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por e-mail ou tipo..."
            className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
        </div>

        {/* Accounts table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-card-foreground">Todas as Contas</h3>
            <span className="text-xs text-muted-foreground">{filtered.length} conta(s)</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma conta encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">E-mail</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any) => {
                    const isEditing = editingId === a.id;
                    return (
                      <tr key={a.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 text-foreground">{a.email || a.user_id?.substring(0, 16) + "…"}</td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <select value={editRole} onChange={e => setEditRole(e.target.value)}
                              className="rounded border border-border bg-background px-2 py-1 text-xs">
                              <option value="admin">Administrador</option>
                              <option value="user">Usuário</option>
                              <option value="company_user">Usuário Empresa</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          ) : (
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              a.role === "admin" ? "bg-primary/10 text-primary" :
                              a.role === "super_admin" ? "bg-destructive/10 text-destructive" :
                              a.role === "company_user" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground")}>
                              {ROLE_LABEL[a.role] || a.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <button onClick={() => handleUpdate(a.id)} className="rounded p-1 text-success hover:bg-success/10"><Check className="h-4 w-4" /></button>
                                <button onClick={() => setEditingId(null)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingId(a.id); setEditRole(a.role); }}
                                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handleDelete(a.id, a.user_id)}
                                  className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
