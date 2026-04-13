import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Pencil, Check, X, CreditCard, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuperAdminSubscriptions() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editMaxCompanies, setEditMaxCompanies] = useState(1);
  const [editMaxUsers, setEditMaxUsers] = useState(3);
  const [editMaxResponses, setEditMaxResponses] = useState(500);
  const [editStatus, setEditStatus] = useState("active");

  // Create subscription form
  const [showCreate, setShowCreate] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newPlan, setNewPlan] = useState("starter");
  const [newMaxCompanies, setNewMaxCompanies] = useState(1);
  const [newMaxUsers, setNewMaxUsers] = useState(1);
  const [newMaxResponses, setNewMaxResponses] = useState(20);
  const [creating, setCreating] = useState(false);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["super-admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get admin users to assign subscriptions
  const { data: adminUsers = [] } = useQuery({
    queryKey: ["super-admin-admin-users"],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify({ action: "list" }),
        headers: { "Content-Type": "application/json" },
      });
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const emailMap: Record<string, string> = {};
      if (parsed?.users) parsed.users.forEach((u: any) => { emailMap[u.id] = u.email; });
      const admins = (parsed?.roles || []).filter((r: any) => r.role === "admin");
      return admins.map((r: any) => ({ id: r.user_id, email: emailMap[r.user_id] || r.user_id }));
    },
  });

  const getAdminEmail = (userId: string) => {
    const admin = adminUsers.find((a: any) => a.id === userId);
    return admin?.email || userId.substring(0, 16) + "…";
  };

  const handleUpdate = async (subId: string) => {
    try {
      const { error } = await supabase.from("subscriptions").update({
        plan_name: editPlan,
        max_companies: editMaxCompanies,
        max_users: editMaxUsers,
        max_responses_per_month: editMaxResponses,
        status: editStatus,
      }).eq("id", subId);
      if (error) throw error;
      toast({ title: "Assinatura atualizada!" });
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["super-admin-subscriptions"] });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  const handleCreate = async () => {
    if (!newUserId) { toast({ title: "Selecione um cliente", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: newUserId,
        plan_name: newPlan,
        max_companies: newMaxCompanies,
        max_users: newMaxUsers,
        max_responses_per_month: newMaxResponses,
        status: "active",
      });
      if (error) throw error;
      toast({ title: "Assinatura criada!" });
      setShowCreate(false);
      setNewUserId(""); setNewPlan("starter");
      qc.invalidateQueries({ queryKey: ["super-admin-subscriptions"] });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    setCreating(false);
  };

  return (
    <SuperAdminLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestão de Assinaturas</h1>
            <p className="text-sm text-muted-foreground mt-1">Defina planos e limites de uso dos clientes</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nova Assinatura
          </button>
        </div>

        {/* Create */}
        {showCreate && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground">Nova Assinatura</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Cliente (Admin)</label>
                <select value={newUserId} onChange={e => setNewUserId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  {adminUsers.map((a: any) => <option key={a.id} value={a.id}>{a.email}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Plano</label>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="starter">Starter</option>
                  <option value="professional">Profissional</option>
                  <option value="enterprise">Empresarial</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Máx. Empresas</label>
                <input type="number" value={newMaxCompanies} onChange={e => setNewMaxCompanies(+e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Máx. Usuários</label>
                <input type="number" value={newMaxUsers} onChange={e => setNewMaxUsers(+e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Máx. Respostas/Mês</label>
                <input type="number" value={newMaxResponses} onChange={e => setNewMaxResponses(+e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Criar
              </button>
              <button onClick={() => setShowCreate(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        )}

        {/* Subscriptions table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">Assinaturas Ativas</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma assinatura encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Cliente</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Plano</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Empresas</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Usuários</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Respostas</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub: any) => {
                    const isEditing = editingId === sub.id;
                    return (
                      <tr key={sub.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 text-foreground text-xs">{getAdminEmail(sub.user_id)}</td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                              className="rounded border border-border bg-background px-2 py-1 text-xs">
                              <option value="starter">Starter</option>
                              <option value="professional">Profissional</option>
                              <option value="enterprise">Empresarial</option>
                            </select>
                          ) : (
                            <span className="text-xs font-medium capitalize">{sub.plan_name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? <input type="number" value={editMaxCompanies} onChange={e => setEditMaxCompanies(+e.target.value)}
                            className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-center" /> : sub.max_companies}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? <input type="number" value={editMaxUsers} onChange={e => setEditMaxUsers(+e.target.value)}
                            className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-center" /> : sub.max_users}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? <input type="number" value={editMaxResponses} onChange={e => setEditMaxResponses(+e.target.value)}
                            className="w-20 rounded border border-border bg-background px-2 py-1 text-xs text-center" /> : sub.max_responses_per_month}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                              className="rounded border border-border bg-background px-2 py-1 text-xs">
                              <option value="active">Ativo</option>
                              <option value="inactive">Inativo</option>
                              <option value="expired">Expirado</option>
                            </select>
                          ) : (
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              sub.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                              {sub.status === "active" ? "Ativo" : sub.status === "expired" ? "Expirado" : "Inativo"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleUpdate(sub.id)} className="rounded p-1 text-success hover:bg-success/10"><Check className="h-4 w-4" /></button>
                              <button onClick={() => setEditingId(null)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <button onClick={() => {
                              setEditingId(sub.id); setEditPlan(sub.plan_name); setEditMaxCompanies(sub.max_companies);
                              setEditMaxUsers(sub.max_users); setEditMaxResponses(sub.max_responses_per_month); setEditStatus(sub.status);
                            }} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                          )}
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
