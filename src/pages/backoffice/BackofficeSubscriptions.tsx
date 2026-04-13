import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackofficeLayout } from "@/components/backoffice/BackofficeLayout";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function BackofficeSubscriptions() {
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["backoffice-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <BackofficeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Assinaturas</h1>
          <p className="text-sm text-slate-400 mt-1">Todas as assinaturas da plataforma</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Empresas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Usuários</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Respostas/mês</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-500" /></td></tr>
                ) : !subscriptions?.length ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nenhuma assinatura</td></tr>
                ) : (
                  subscriptions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-xs text-white">{sub.user_id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-white">{sub.plan_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sub.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{sub.max_companies}</td>
                      <td className="px-4 py-3 text-slate-300">{sub.max_users}</td>
                      <td className="px-4 py-3 text-slate-300">{sub.max_responses_per_month}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{format(new Date(sub.created_at), "dd/MM/yyyy")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
}
