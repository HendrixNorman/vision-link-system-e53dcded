import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Palette, Loader2, Save, RotateCcw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { COLOR_PRESETS, DEFAULT_THEME_COLOR, ThemeColor } from "@/lib/themeColor";
import { previewBrandColor } from "@/components/BrandThemeSync";
import { cn } from "@/lib/utils";

export function BrandColorCard() {
  const { settings, refresh } = useSiteSettings();
  const [color, setColor] = useState<ThemeColor>(DEFAULT_THEME_COLOR);
  const [saved, setSaved] = useState<ThemeColor>(DEFAULT_THEME_COLOR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const next: ThemeColor = {
      hue: settings.theme_hue ?? DEFAULT_THEME_COLOR.hue,
      saturation: settings.theme_saturation ?? DEFAULT_THEME_COLOR.saturation,
      accentHue: settings.theme_accent_hue ?? DEFAULT_THEME_COLOR.accentHue,
    };
    setColor(next);
    setSaved(next);
  }, [settings?.theme_hue, settings?.theme_saturation, settings?.theme_accent_hue]);

  const update = (patch: Partial<ThemeColor>) => {
    const next = { ...color, ...patch };
    setColor(next);
    previewBrandColor(next);
  };

  const dirty =
    color.hue !== saved.hue || color.saturation !== saved.saturation || color.accentHue !== saved.accentHue;

  const save = async () => {
    if (!settings?.id) {
      toast.error("Site settings row missing");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          theme_hue: color.hue,
          theme_saturation: color.saturation,
          theme_accent_hue: color.accentHue,
        })
        .eq("id", settings.id);
      if (error) throw error;
      setSaved(color);
      toast.success("Website colour applied for everyone");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to save colour");
    } finally {
      setSaving(false);
    }
  };

  const revert = () => {
    setColor(saved);
    previewBrandColor(saved);
  };

  return (
    <Card className="glass-panel border-0 rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Website colour</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Pick a theme and the entire portal — landing page, dashboards, buttons — recolours instantly.
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
          {COLOR_PRESETS.map((p) => {
            const active = p.hue === color.hue && p.saturation === color.saturation && p.accentHue === color.accentHue;
            return (
              <button
                key={p.name}
                type="button"
                title={p.name}
                onClick={() => update({ hue: p.hue, saturation: p.saturation, accentHue: p.accentHue })}
                className={cn(
                  "aspect-square rounded-2xl transition-spring hover:scale-105 flex items-center justify-center",
                  active ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "ring-1 ring-border/60"
                )}
                style={{
                  background: `linear-gradient(135deg, hsl(${p.hue} ${p.saturation}% 30%) 0%, hsl(${p.accentHue} ${p.saturation + 6}% 48%) 100%)`,
                }}
                aria-label={p.name}
              >
                {active && <Check className="h-4 w-4 text-primary-foreground" />}
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Main colour</Label>
              <span className="text-xs text-muted-foreground">{color.hue}°</span>
            </div>
            <Slider value={[color.hue]} min={0} max={360} step={1} onValueChange={([v]) => update({ hue: v })} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Accent colour</Label>
              <span className="text-xs text-muted-foreground">{color.accentHue}°</span>
            </div>
            <Slider
              value={[color.accentHue]}
              min={0}
              max={360}
              step={1}
              onValueChange={([v]) => update({ accentHue: v })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Intensity</Label>
              <span className="text-xs text-muted-foreground">{color.saturation}%</span>
            </div>
            <Slider
              value={[color.saturation]}
              min={20}
              max={95}
              step={1}
              onValueChange={([v]) => update({ saturation: v })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          <Button variant="hero" onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Apply to website
          </Button>
          <Button variant="glass" onClick={revert} disabled={!dirty || saving}>
            <RotateCcw className="h-4 w-4 mr-2" /> Undo preview
          </Button>
          <Button
            variant="ghost"
            onClick={() => update(DEFAULT_THEME_COLOR)}
            disabled={saving}
          >
            Reset to emerald
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
