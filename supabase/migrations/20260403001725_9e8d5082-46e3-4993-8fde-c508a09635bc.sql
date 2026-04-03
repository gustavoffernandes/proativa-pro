
DROP POLICY IF EXISTS "Anyone can submit survey responses" ON public.survey_responses;

CREATE POLICY "Anon can submit to active surveys"
  ON public.survey_responses
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.google_forms_config
      WHERE id = config_id AND is_active = true
    )
  );
