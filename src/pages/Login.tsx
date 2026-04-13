import { useState, forwardRef } from "react";
import { Navigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Login = forwardRef<HTMLDivElement>(function Login(_props, ref) {
  const { user, loading, signIn, isSuperAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={isSuperAdmin ? "/super-admin" : "/"} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: "E-mail ou senha incorretos.", variant: "destructive" });
    }
  };

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">PROATIVA</h1>
            <p className="text-sm text-muted-foreground">Dashboard Analítico</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">Entrar na plataforma</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acesso restrito a usuários autorizados</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</> : "Entrar"}
            </button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <button type="button" onClick={async () => {
              if (!email) { toast({ title: "Informe o e-mail", description: "Preencha o campo de e-mail.", variant: "destructive" }); return; }
              const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
              if (error) toast({ title: "Erro", description: "Não foi possível enviar o e-mail.", variant: "destructive" });
              else toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada." });
            }} className="text-xs text-primary hover:underline">Esqueci minha senha</button>
            <p className="text-xs text-muted-foreground">Não possui acesso? Entre em contato com o administrador.</p>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">© 2026 PROATIVA. Todos os direitos reservados.</p>
      </div>
    </div>
  );
});

export default Login;
