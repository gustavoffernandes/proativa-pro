
DROP POLICY IF EXISTS "Anon can update own session" ON public.survey_sessions;
CREATE POLICY "Anon can update own session by token"
  ON public.survey_sessions FOR UPDATE TO anon
  USING (true)
  WITH CHECK (status IN ('in_progress', 'completed'));

DROP POLICY IF EXISTS "Anon can read own session" ON public.survey_sessions;
CREATE POLICY "Anon can read own session by token"
  ON public.survey_sessions FOR SELECT TO anon
  USING (true);
