import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function SuperAdminAuditLogs() {
  const [limit, setLimit] = useState(50);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["super-admin-audit-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <SuperAdminLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Logs de Auditoria</h1>
            <p className="text-sm text-muted-foreground mt-1">Registro de ações realizadas na plataforma</p>
          </div>
          <select value={limit} onChange={e => setLimit(+e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value={50}>Últimos 50</option>
            <option value={100}>Últimos 100</option>
            <option value={500}>Últimos 500</option>
          </select>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <ScrollText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum log de auditoria encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Data/Hora</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ação</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Entidade</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 text-xs text-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{log.entity}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground max-w-xs truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
