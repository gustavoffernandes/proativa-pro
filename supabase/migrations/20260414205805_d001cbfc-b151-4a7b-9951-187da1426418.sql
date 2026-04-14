
-- Add contact and address columns to google_forms_config
ALTER TABLE public.google_forms_config
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_zip text,
  ADD COLUMN IF NOT EXISTS form_status text NOT NULL DEFAULT 'ativa';

-- Update existing rows: set form_status based on is_active
UPDATE public.google_forms_config SET form_status = 'encerrada' WHERE is_active = false AND form_status = 'ativa';

-- Fix RLS: Allow authenticated users to also submit survey responses
CREATE POLICY "Authenticated can submit to active surveys"
ON public.survey_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.google_forms_config
    WHERE id = survey_responses.config_id
    AND is_active = true
  )
);
