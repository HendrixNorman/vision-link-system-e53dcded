import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { applyThemeColor, DEFAULT_THEME_COLOR, ThemeColor } from "@/lib/themeColor";

export const BRAND_PREVIEW_EVENT = "brand-color-preview";

/** Applies the admin-selected brand colour to CSS variables app-wide. */
export function BrandThemeSync() {
  const { theme } = useTheme();
  const [color, setColor] = useState<ThemeColor>(DEFAULT_THEME_COLOR);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("theme_hue, theme_saturation, theme_accent_hue")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        setColor({
          hue: data.theme_hue ?? DEFAULT_THEME_COLOR.hue,
          saturation: data.theme_saturation ?? DEFAULT_THEME_COLOR.saturation,
          accentHue: data.theme_accent_hue ?? DEFAULT_THEME_COLOR.accentHue,
        });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onPreview = (e: Event) => {
      const detail = (e as CustomEvent<ThemeColor>).detail;
      if (detail) setColor(detail);
    };
    window.addEventListener(BRAND_PREVIEW_EVENT, onPreview);
    return () => window.removeEventListener(BRAND_PREVIEW_EVENT, onPreview);
  }, []);

  useEffect(() => {
    applyThemeColor(color, theme);
  }, [color, theme]);

  return null;
}

export function previewBrandColor(color: ThemeColor) {
  window.dispatchEvent(new CustomEvent<ThemeColor>(BRAND_PREVIEW_EVENT, { detail: color }));
}
