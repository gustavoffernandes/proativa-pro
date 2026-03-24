-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Create google_forms_config table
CREATE TABLE public.google_forms_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  spreadsheet_id TEXT NOT NULL,
  sheet_name TEXT NOT NULL DEFAULT 'Form Responses 1',
  form_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.google_forms_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read configs" ON public.google_forms_config FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert configs" ON public.google_forms_config FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update configs" ON public.google_forms_config FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete configs" ON public.google_forms_config FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.google_forms_config(id) ON DELETE CASCADE,
  response_timestamp TIMESTAMP WITH TIME ZONE,
  respondent_name TEXT,
  sex TEXT,
  age INTEGER,
  sector TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read responses" ON public.survey_responses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert responses" ON public.survey_responses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete responses" ON public.survey_responses FOR DELETE USING (auth.uid() IS NOT NULL);
