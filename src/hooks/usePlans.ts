import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlanFeatures {
  relatorio_pdf?: boolean;
  exportacao_excel?: boolean;
  matriz_risco?: boolean;
  filtro_ghe?: boolean;
  suporte_prioritario?: boolean;
  [k: string]: boolean | undefined;
}

export interface Plan {
  id: string; // text: 'starter' | 'professional' | 'enterprise'
  name: string;
  description: string | null;
  max_companies: number;
  max_surveys_per_month: number;
  max_respondents: number;
  max_users: number;
  features: PlanFeatures;
  price_monthly: number;
  price_annual: number;
  active: boolean;
}

/** All active plans (ordered by price). */
export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return (data || []) as Plan[];
    },
  });
}

/**
 * Plan currently assigned to the logged-in user.
 * Source of truth: system_accounts (status='active') -> plans.
 * Plan assignment is managed exclusively via Supabase (no dashboard UI).
 */
export function useCurrentUserPlan() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["current-user-plan", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: account, error: aErr } = await (supabase as any)
        .from("system_accounts")
        .select("plan_id, status, expires_at")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("activated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (aErr) throw aErr;
      const planId = account?.plan_id;
      if (!planId) return null;
      const { data: plan, error } = await (supabase as any)
        .from("plans")
        .select("*")
        .eq("id", planId)
        .maybeSingle();
      if (error) throw error;
      return (plan as Plan) ?? null;
    },
  });
}
