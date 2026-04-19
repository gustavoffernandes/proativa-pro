import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_highlight: boolean;
  sort_order: number;
  max_companies: number;
  max_surveys: number;
  max_respondents: number;
  max_users: number;
  feature_pdf_report: boolean;
  feature_excel_export: boolean;
  feature_risk_matrix: boolean;
  feature_sector_filters: boolean;
  feature_priority_support: boolean;
  is_active: boolean;
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as Plan[];
    },
  });
}

/** Plan currently assigned to the logged-in user (via profiles.current_plan_id). */
export function useCurrentUserPlan() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["current-user-plan", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profile, error: pErr } = await (supabase as any)
        .from("profiles")
        .select("current_plan_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (pErr) throw pErr;
      const planId = profile?.current_plan_id;
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

/** Map of user_id -> plan_id (admin only — uses profiles select policy that admins now have). */
export function useUserPlanAssignments(enabled: boolean) {
  return useQuery({
    queryKey: ["user-plan-assignments"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("user_id, current_plan_id");
      if (error) throw error;
      const map: Record<string, string | null> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p.current_plan_id ?? null; });
      return map;
    },
  });
}
