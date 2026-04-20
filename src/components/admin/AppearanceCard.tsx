import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import defaultLogo from "@/assets/school-logo.png";

type Field = "logo_url" | "hero_url";

export function AppearanceCard() {
  const { settings, refresh } = useSiteSettings();
  const [uploading, setUploading] = useState<Field | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const heroInput = useRef<HTMLInputElement>(null);

  const handleUpload = async (field: Field, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(field);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${field === "logo_url" ? "logo" : "hero"}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      if (!settings?.id) throw new Error("Site settings row missing");
      const { error: updErr } = await supabase
        .from("site_settings")
        .update({ [field]: publicUrl })
        .eq("id", settings.id);
      if (updErr) throw updErr;

      toast.success(field === "logo_url" ? "Logo updated" : "Hero image updated");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const logoSrc = settings?.logo_url || defaultLogo;

  return (
    <Card className="shadow-soft">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Appearance</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Update the school logo and landing page hero image.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Logo */}
          <div className="space-y-3">
            <div className="text-sm font-medium">School logo</div>
            <div className="h-28 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden">
              <img src={logoSrc} alt="Current logo" className="max-h-full max-w-full object-contain p-3" />
            </div>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload("logo_url", f);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={uploading === "logo_url"}
              onClick={() => logoInput.current?.click()}
            >
              {uploading === "logo_url" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Change logo</>
              )}
            </Button>
          </div>

          {/* Hero */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Landing hero image</div>
            <div className="h-28 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden">
              {settings?.hero_url ? (
                <img src={settings.hero_url} alt="Current hero" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">Using default hero image</span>
              )}
            </div>
            <input
              ref={heroInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload("hero_url", f);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={uploading === "hero_url"}
              onClick={() => heroInput.current?.click()}
            >
              {uploading === "hero_url" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Change hero</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
