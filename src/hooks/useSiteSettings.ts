import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  hero_url: string | null;
  school_name: string | null;
}

const DEFAULT_NAME = "School Portal";

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("id, logo_url, hero_url, school_name")
      .limit(1)
      .maybeSingle();
    setSettings(data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const schoolName = settings?.school_name?.trim() || DEFAULT_NAME;

  return { settings, schoolName, loading, refresh: fetchSettings };
}
