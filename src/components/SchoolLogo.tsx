import { useSiteSettings } from "@/hooks/useSiteSettings";
import defaultLogo from "@/assets/school-logo.png";

export function SchoolLogo({ className = "" }: { className?: string }) {
  const { settings, schoolName } = useSiteSettings();
  const src = settings?.logo_url || defaultLogo;

  // Split into main + tagline (everything after first space if multi-word)
  const parts = schoolName.split(/\s+/);
  const main = parts.length > 1 ? parts.slice(0, -1).join(" ") : schoolName;
  const tail = parts.length > 1 ? parts[parts.length - 1] : "";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shadow-soft overflow-hidden border border-border/60">
        <img
          src={src}
          alt={`${schoolName} logo`}
          className="h-full w-full object-contain p-1"
        />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-base">{main}</div>
        {tail && (
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{tail}</div>
        )}
      </div>
    </div>
  );
}
