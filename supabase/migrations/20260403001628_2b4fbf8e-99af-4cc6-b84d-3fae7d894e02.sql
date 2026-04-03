
-- Add form configuration columns to google_forms_config
ALTER TABLE public.google_forms_config 
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS instructions text DEFAULT 'Esta pesquisa é anônima e confidencial. Suas respostas serão utilizadas para melhorar o ambiente de trabalho. Por favor, responda com sinceridade.',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_consent boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_password boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS survey_password text DEFAULT '';

-- Add demographic columns to survey_responses
ALTER TABLE public.survey_responses 
  ADD COLUMN IF NOT EXISTS escolaridade text,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS tempo_empresa text,
  ADD COLUMN IF NOT EXISTS ghe text,
  ADD COLUMN IF NOT EXISTS open_answers jsonb DEFAULT '{}'::jsonb;

-- Allow anonymous users to insert survey responses (public form)
CREATE POLICY "Anyone can submit survey responses"
  ON public.survey_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to read form config (to render form)
CREATE POLICY "Anyone can read active form configs"
  ON public.google_forms_config
  FOR SELECT
  TO anon
  USING (is_active = true);
