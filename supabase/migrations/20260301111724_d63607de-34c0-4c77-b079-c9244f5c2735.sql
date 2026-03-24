
-- Action plans table
CREATE TABLE public.action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_config_id text NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  factor_id text NOT NULL DEFAULT '',
  risk_level text NOT NULL DEFAULT 'PR4',
  risk_score integer NOT NULL DEFAULT 1,
  deadline_days integer NOT NULL DEFAULT 180,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action plans" ON public.action_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create action plans" ON public.action_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update action plans" ON public.action_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete action plans" ON public.action_plans FOR DELETE USING (auth.uid() = user_id);

-- Action plan tasks table
CREATE TABLE public.action_plan_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id uuid REFERENCES public.action_plans(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  is_completed boolean NOT NULL DEFAULT false,
  observation text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.action_plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks" ON public.action_plan_tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create tasks" ON public.action_plan_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update tasks" ON public.action_plan_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete tasks" ON public.action_plan_tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at on action_plans
CREATE TRIGGER update_action_plans_updated_at BEFORE UPDATE ON public.action_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on action_plan_tasks
CREATE TRIGGER update_action_plan_tasks_updated_at BEFORE UPDATE ON public.action_plan_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
