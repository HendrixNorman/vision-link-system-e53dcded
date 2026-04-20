-- Site settings table (single-row config for site-wide assets)
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  hero_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous landing visitors) can read site settings
CREATE POLICY "site_settings_public_read"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "site_settings_admin_write"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed a single row
INSERT INTO public.site_settings (logo_url, hero_url) VALUES (NULL, NULL);

-- updated_at trigger
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public storage bucket for site assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin write
CREATE POLICY "site_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "site_assets_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "site_assets_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "site_assets_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));