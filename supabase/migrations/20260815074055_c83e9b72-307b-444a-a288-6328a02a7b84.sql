ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS theme_hue integer NOT NULL DEFAULT 158,
  ADD COLUMN IF NOT EXISTS theme_saturation integer NOT NULL DEFAULT 64,
  ADD COLUMN IF NOT EXISTS theme_accent_hue integer NOT NULL DEFAULT 158,
  ADD COLUMN IF NOT EXISTS theme_preset text;