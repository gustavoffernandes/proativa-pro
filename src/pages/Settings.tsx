import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon, User, Palette, Save, UserPlus, Loader2, Sun, Moon, Monitor, Pencil, Trash2, X, Check, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type TabId = "perfil" | "aparencia" | "geral";

const allTabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "geral", label: "Geral", icon: SettingsIcon },
];

type ThemeMode = "light" | "dark" | "system";

function getStoredTheme(): ThemeMode {
  return (localStorage.getItem("proativa-theme") as ThemeMode) || "system";
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", mode === "dark");
  }
  localStorage.setItem("proativa-theme", mode);
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  user: "Usuário Geral",
  company_user: "Usuário Empresa",
};

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const tabs = allTabs;
  const [activeTab, setActiveTab] = useState<TabId>("perfil");

  // Profile fields
  const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || "");
  const [profileRole, setProfileRole] = useState(user?.user_metadata?.role_label || "");
  const [profileCompany, setProfileCompany] = useState(user?.user_metadata?.company_name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user" | "company_user">("user");
  const [newUserCompanyId, setNewUserCompanyId] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("");
  const [editingCompanyId, setEditingCompanyId] = useState<string>("");

  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [fontSize, setFontSize] = useState<"normal" | "large">(
    (localStorage.getItem("proativa-fontsize") as "normal" | "large") || "normal"
  );
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize === "large" ? "18px" : "16px";
    localStorage.setItem("proativa-fontsize", fontSize);
  }, [fontSize]);

  const { data: companiesList = [] } = useQuery({
    queryKey: ["companies-for-user-creation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_forms_config")
        .select("id, company_name, cnpj")
        .eq("is_active", true)
        .order("company_name");
      if (error) throw error;
      const seen = new Map<string, { id: string; company_name: string }>();
      (data || []).forEach((c: any) => {
        const key = c.cnpj || c.id;
        if (!seen.has(key)) seen.set(key, { id: c.id, company_name: c.company_name });
      });
      return Array.from(seen.values());
    },
    enabled: isAdmin,
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ["all-companies-for-lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_forms_config")
        .select("id, company_name")
        .order("company_name");
      if (error) throw error;
      return (data || []) as { id: string; company_name: string }[];
    },
    enabled: isAdmin,
  });

  const { data: userRoles = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify({ action: "list" }),
        headers: { "Content-Type": "application/json" },
      });
      if (fnError) throw fnError;
      const parsed = typeof fnData === "string" ? JSON.parse(fnData) : fnData;
      const emailMap: Record<string, string> = {};
      if (parsed?.users) {
        parsed.users.forEach((u: any) => { emailMap[u.id] = u.email; });
      }
      const rolesData = parsed?.roles || [];
      return rolesData.map((r: any) => ({ ...r, email: emailMap[r.user_id] || "" }));
    },
    enabled: isAdmin,
    refetchOnWindowFocus: true,
  });

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: profileName, role_label: profileRole, company_name: profileCompany },
      });
      if (error) throw error;
      toast({ title: "Perfil salvo!", description: "Suas informações foram atualizadas." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" }); return; }
    if (newPassword !== confirmNewPassword) { toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" }); return; }
    if (!currentPassword) { toast({ title: "Erro", description: "Informe a senha atual.", variant: "destructive" }); return; }

    setChangingPassword(true);
    try {
      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });
      if (signInError) { toast({ title: "Erro", description: "Senha atual incorreta.", variant: "destructive" }); setChangingPassword(false); return; }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha alterada!", description: "Sua senha foi atualizada com sucesso." });
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch (e: any) {
      toast({ title: "Erro ao alterar senha", description: e.message, variant: "destructive" });
    }
    setChangingPassword(false);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) { toast({ title: "Preencha todos os campos", variant: "destructive" }); return; }
    if (newUserPassword.length < 8) { toast({ title: "Senha deve ter pelo menos 8 caracteres", variant: "destructive" }); return; }
    if (newUserRole === "company_user" && !newUserCompanyId) { toast({ title: "Selecione uma empresa para o Usuário Empresa", variant: "destructive" }); return; }
    setCreatingUser(true);
    try {
      const body: Record<string, string> = { email: newUserEmail, password: newUserPassword, role: newUserRole };
      if (newUserRole === "company_user") body.company_id = newUserCompanyId;
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw error;
      const roleLabel = ROLE_LABEL[newUserRole] || newUserRole;
      toast({ title: "Usuário criado!", description: `${newUserEmail} foi adicionado como ${roleLabel}.` });
      setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("user"); setNewUserCompanyId("");
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
    } catch (e: any) { toast({ title: "Erro ao criar usuário", description: e.message, variant: "destructive" }); }
    setCreatingUser(false);
  };

  const handleUpdateUserRole = async (userRoleId: string) => {
    try {
      const body: any = { action: "update", role_id: userRoleId, role: editingRole };
      if (editingRole === "company_user") body.company_id = editingCompanyId || null;
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Usuário atualizado!" });
      setEditingUserId(null);
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userRoleId: string, userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário definitivamente? Esta ação não pode ser desfeita.")) return;
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: JSON.stringify({ action: "delete", user_id: userId, role_id: userRoleId }),
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Usuário removido!" });
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ElementType; description: string }[] = [
    { mode: "light", label: "Claro", icon: Sun, description: "Tema claro padrão" },
    { mode: "dark", label: "Escuro", icon: Moon, description: "Tema escuro para conforto visual" },
    { mode: "system", label: "Sistema", icon: Monitor, description: "Segue a preferência do sistema operacional" },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div><h1 className="text-2xl font-bold text-foreground">Configurações</h1><p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil e preferências</p></div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-56 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-card">

            {/* PERFIL */}
            {activeTab === "perfil" && (
              <div className="space-y-8 max-w-md">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-card-foreground">Perfil</h3>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <input value={profileName} onChange={e => setProfileName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Cargo</label>
                    <input value={profileRole} onChange={e => setProfileRole(e.target.value)}
                      placeholder="Ex: Gestor SST"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Empresa</label>
                    <input value={profileCompany} onChange={e => setProfileCompany(e.target.value)}
                      placeholder="Ex: PROATIVA Consultoria"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                  </div>
                  <button onClick={handleSaveProfile} disabled={savingProfile}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
                  </button>
                </div>

                {/* Change Password */}
                <div className="space-y-4 border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2"><Lock className="h-4 w-4" /> Alterar Senha</h3>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Senha Atual *</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Nova Senha *</label>
                    <div className="relative">
                      <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Mínimo 6 caracteres</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Confirmar Nova Senha *</label>
                    <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
                  </div>
                  <button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Alterar Senha
                  </button>
                </div>
              </div>
            )}

            {/* APARÊNCIA */}
            {activeTab === "aparencia" && (
              <div className="space-y-6 max-w-lg">
                <h3 className="text-lg font-semibold text-card-foreground">Aparência</h3>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Tema</label>
                  <div className="grid grid-cols-3 gap-3">
                    {themeOptions.map(opt => (
                      <button key={opt.mode} onClick={() => setTheme(opt.mode)}
                        className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                          theme === opt.mode ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40 hover:bg-muted/50")}>
                        <opt.icon className={cn("h-6 w-6", theme === opt.mode ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-sm font-medium", theme === opt.mode ? "text-primary" : "text-foreground")}>{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground text-center">{opt.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Tamanho da Fonte</label>
                  <div className="flex gap-3">
                    <button onClick={() => setFontSize("normal")}
                      className={cn("flex-1 rounded-xl border-2 p-3 text-center transition-all",
                        fontSize === "normal" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                      <span className="text-sm font-medium">Aa</span>
                      <p className="text-xs text-muted-foreground mt-1">Normal</p>
                    </button>
                    <button onClick={() => setFontSize("large")}
                      className={cn("flex-1 rounded-xl border-2 p-3 text-center transition-all",
                        fontSize === "large" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                      <span className="text-lg font-medium">Aa</span>
                      <p className="text-xs text-muted-foreground mt-1">Grande</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GERAL */}
            {activeTab === "geral" && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-semibold text-card-foreground">Geral</h3>
                <p className="text-sm text-muted-foreground">Configurações gerais da plataforma.</p>
                <div className="rounded-lg bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Versão: 2.0.0</p><p className="text-xs text-muted-foreground">© 2026 PROATIVA</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
