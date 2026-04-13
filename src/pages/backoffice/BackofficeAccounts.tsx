import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackofficeLayout } from "@/components/backoffice/BackofficeLayout";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface AccountRow {
  user_id: string;
  email: string;
  role: string;
  subscription: {
    id: string;
    plan_name: string;
    status: string;
    max_companies: number;
    max_users: number;
    max_responses_per_month: number;
    expires_at: string | null;
  } | null;
}

export default function BackofficeAccounts() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<AccountRow | null>(null);

  // Form state for new account
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPlan, setNewPlan] = useState("basic");
  const [newMaxCompanies, setNewMaxCompanies] = useState(3);
  const [newMaxUsers, setNewMaxUsers] = useState(5);
  const [newMaxResponses, setNewMaxResponses] = useState(1000);

  // Edit sub form
  const [editPlan, setEditPlan] = useState("");
  const [editMaxCompanies, setEditMaxCompanies] = useState(0);
  const [editMaxUsers, setEditMaxUsers] = useState(0);
  const [editMaxResponses, setEditMaxResponses] = useState(0);
  const [editStatus, setEditStatus] = useState("active");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["backoffice-accounts"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "user", "company_user"]);

      if (!roles?.length) return [];

      const userIds = roles.map((r: any) => r.user_id);
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .in("user_id", userIds);

      // Get emails from auth via edge function or just show user_id
      const results: AccountRow[] = roles.map((r: any) => ({
        user_id: r.user_id,
        email: r.user_id, // will be replaced if we can get email
        role: r.role,
        subscription: (subs ?? []).find((s: any) => s.user_id === r.user_id) ?? null,
      }));

      return results;
    },
  });

  const createAccount = useMutation({
    mutationFn: async () => {
      // Use the create-user edge function
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email: newEmail, password: newPassword, role: "admin" },
      });
      if (error) throw error;

      const userId = data?.user?.id;
      if (userId) {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan_name: newPlan,
          max_companies: newMaxCompanies,
          max_users: newMaxUsers,
          max_responses_per_month: newMaxResponses,
        });
      }
    },
    onSuccess: () => {
      toast({ title: "Conta criada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["backoffice-accounts"] });
      setDialogOpen(false);
      setNewEmail("");
      setNewPassword("");
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async () => {
      if (!editingSub?.subscription?.id) {
        // Create subscription
        await supabase.from("subscriptions").insert({
          user_id: editingSub!.user_id,
          plan_name: editPlan,
          status: editStatus,
          max_companies: editMaxCompanies,
          max_users: editMaxUsers,
          max_responses_per_month: editMaxResponses,
        });
      } else {
        await supabase
          .from("subscriptions")
          .update({
            plan_name: editPlan,
            status: editStatus,
            max_companies: editMaxCompanies,
            max_users: editMaxUsers,
            max_responses_per_month: editMaxResponses,
          })
          .eq("id", editingSub.subscription.id);
      }
    },
    onSuccess: () => {
      toast({ title: "Assinatura atualizada" });
      queryClient.invalidateQueries({ queryKey: ["backoffice-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["backoffice-stats"] });
      setEditDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const openEdit = (account: AccountRow) => {
    setEditingSub(account);
    setEditPlan(account.subscription?.plan_name ?? "basic");
    setEditMaxCompanies(account.subscription?.max_companies ?? 3);
    setEditMaxUsers(account.subscription?.max_users ?? 5);
    setEditMaxResponses(account.subscription?.max_responses_per_month ?? 1000);
    setEditStatus(account.subscription?.status ?? "active");
    setEditDialogOpen(true);
  };

  return (
    <BackofficeLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestão de Contas</h1>
            <p className="text-sm text-slate-400 mt-1">
              Gerencie administradores e suas assinaturas
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium">
                <Plus className="h-4 w-4 mr-1" /> Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Criar nova conta admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm text-slate-400">E-mail</label>
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="admin@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Senha</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Plano</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full mt-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Máx. Empresas</label>
                    <Input
                      type="number"
                      value={newMaxCompanies}
                      onChange={(e) => setNewMaxCompanies(Number(e.target.value))}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Máx. Usuários</label>
                    <Input
                      type="number"
                      value={newMaxUsers}
                      onChange={(e) => setNewMaxUsers(Number(e.target.value))}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Máx. Respostas/mês</label>
                    <Input
                      type="number"
                      value={newMaxResponses}
                      onChange={(e) => setNewMaxResponses(Number(e.target.value))}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createAccount.mutate()}
                  disabled={createAccount.isPending || !newEmail || !newPassword}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  {createAccount.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Accounts Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                    User ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                    Papel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                    Limites
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : !accounts?.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma conta encontrada
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.user_id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-white font-mono text-xs">
                        {account.user_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                          {account.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {account.subscription?.plan_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {account.subscription ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              account.subscription.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {account.subscription.status}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">Sem assinatura</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {account.subscription
                          ? `${account.subscription.max_companies} emp / ${account.subscription.max_users} usr / ${account.subscription.max_responses_per_month} resp`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(account)}
                          className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Editar Assinatura</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm text-slate-400">Plano</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full mt-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full mt-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Máx. Empresas</label>
                  <Input
                    type="number"
                    value={editMaxCompanies}
                    onChange={(e) => setEditMaxCompanies(Number(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Máx. Usuários</label>
                  <Input
                    type="number"
                    value={editMaxUsers}
                    onChange={(e) => setEditMaxUsers(Number(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Máx. Respostas/mês</label>
                  <Input
                    type="number"
                    value={editMaxResponses}
                    onChange={(e) => setEditMaxResponses(Number(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={() => updateSubscription.mutate()}
                disabled={updateSubscription.isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950"
              >
                {updateSubscription.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BackofficeLayout>
  );
}
