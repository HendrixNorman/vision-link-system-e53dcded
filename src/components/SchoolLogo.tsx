import { useSiteSettings } from "@/hooks/useSiteSettings";
import defaultLogo from "@/assets/school-logo.png";

export function SchoolLogo({ className = "" }: { className?: string }) {
  const { settings } = useSiteSettings();
  const src = settings?.logo_url || defaultLogo;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shadow-soft overflow-hidden border border-border/60">
        <img
          src={src}
          alt="Double Vision High School logo"
          className="h-full w-full object-contain p-1"
        />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-base">Double Vision</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">High School</div>
      </div>
    </div>
  );
}
