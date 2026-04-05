
-- 1. Add sectors JSONB column to google_forms_config
ALTER TABLE public.google_forms_config
  ADD COLUMN IF NOT EXISTS sectors jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Create survey_sessions table for tracking in-progress respondents
CREATE TABLE public.survey_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id uuid NOT NULL REFERENCES public.google_forms_config(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  respondent_name text,
  sector text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for survey_sessions
ALTER TABLE public.survey_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can create sessions"
  ON public.survey_sessions FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.google_forms_config
      WHERE id = config_id AND is_active = true
    )
  );

CREATE POLICY "Anon can update own session"
  ON public.survey_sessions FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can read own session"
  ON public.survey_sessions FOR SELECT TO anon
  USING (true);

CREATE POLICY "Authenticated can read all sessions"
  ON public.survey_sessions FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
