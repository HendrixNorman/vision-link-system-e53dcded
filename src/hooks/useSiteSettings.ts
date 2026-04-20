import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  hero_url: string | null;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("id, logo_url, hero_url")
      .limit(1)
      .maybeSingle();
    setSettings(data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, refresh: fetchSettings };
}
