import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActionPlan {
  id: string;
  company_config_id: string;
  user_id: string;
  title: string;
  description: string;
  factor_id: string;
  risk_level: string;
  risk_score: number;
  deadline_days: number;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ActionPlanTask {
  id: string;
  action_plan_id: string;
  title: string;
  description: string;
  is_completed: boolean;
  observation: string;
  created_at: string;
  updated_at: string;
}

export function useActionPlans() {
  const qc = useQueryClient();

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["action-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("action_plans").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ActionPlan[];
    },
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["action-plan-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("action_plan_tasks").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ActionPlanTask[];
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (plan: Omit<ActionPlan, "id" | "created_at" | "updated_at" | "completed_at">) => {
      const { data, error } = await supabase.from("action_plans").insert(plan as any).select().single();
      if (error) throw error;
      return data as ActionPlan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["action-plans"] }),
  });

  const updatePlanStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status };
      if (status === "completed") update.completed_at = new Date().toISOString();
      else update.completed_at = null;
      const { error } = await supabase.from("action_plans").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["action-plans"] }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("action_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action-plans"] });
      qc.invalidateQueries({ queryKey: ["action-plan-tasks"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: { action_plan_id: string; title: string; description?: string; observation?: string }) => {
      const { data, error } = await supabase.from("action_plan_tasks").insert(task as any).select().single();
      if (error) throw error;
      return data as ActionPlanTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["action-plan-tasks"] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_completed?: boolean; observation?: string; title?: string }) => {
      const { error } = await supabase.from("action_plan_tasks").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["action-plan-tasks"] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("action_plan_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["action-plan-tasks"] }),
  });

  return {
    plans,
    tasks,
    isLoading: loadingPlans || loadingTasks,
    createPlan: createPlanMutation.mutateAsync,
    updatePlanStatus: (id: string, status: string) => updatePlanStatusMutation.mutate({ id, status }),
    deletePlan: (id: string) => deletePlanMutation.mutate(id),
    createTask: createTaskMutation.mutateAsync,
    updateTask: (id: string, updates: { is_completed?: boolean; observation?: string }) => updateTaskMutation.mutate({ id, ...updates }),
    deleteTask: (id: string) => deleteTaskMutation.mutate(id),
  };
}
